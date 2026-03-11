"""
Test predictions on trained model and visualize bounding boxes
"""
import torch
import cv2
import numpy as np
from pathlib import Path
import yaml

from models.yolo import YOLOSegModel
from utils.data_loader import YoloDetSegDataset


def load_model(checkpoint_path, cfg_path, device):
    """Load trained model from checkpoint"""
    with open(cfg_path, 'r') as f:
        cfg = yaml.safe_load(f)
    
    num_classes = len(cfg['data']['names'])
    model = YOLOSegModel(cfg['model'], num_classes)
    
    ckpt = torch.load(checkpoint_path, map_location='cpu')
    model.load_state_dict(ckpt['model'])
    model.to(device)
    model.eval()
    
    return model, cfg


def nms(boxes, scores, iou_threshold=0.5):
    """Non-Maximum Suppression to filter overlapping boxes"""
    if len(boxes) == 0:
        return torch.zeros(0, dtype=torch.long)
    
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort(descending=True)
    
    keep = []
    while order.numel() > 0:
        if order.numel() == 1:
            keep.append(order.item())
            break
        
        i = order[0].item()
        keep.append(i)
        
        xx1 = torch.maximum(x1[i], x1[order[1:]])
        yy1 = torch.maximum(y1[i], y1[order[1:]])
        xx2 = torch.minimum(x2[i], x2[order[1:]])
        yy2 = torch.minimum(y2[i], y2[order[1:]])
        
        w = torch.maximum(torch.tensor(0.0), xx2 - xx1)
        h = torch.maximum(torch.tensor(0.0), yy2 - yy1)
        inter = w * h
        
        iou = inter / (areas[i] + areas[order[1:]] - inter)
        
        inds = torch.where(iou <= iou_threshold)[0]
        order = order[inds + 1]
    
    return torch.tensor(keep, dtype=torch.long)


def decode_predictions(outputs, img_size=640, conf_thresh=0.6):
    """Decode model outputs to bounding boxes with proper activations"""
    STRIDES = {"P3": 8, "P4": 16, "P5": 32, "P6": 64}
    
    all_boxes = []
    all_scores = []
    all_classes = []
    
    for level, stride in STRIDES.items():
        if level not in outputs:
            continue
            
        pred = outputs[level]
        box_pred = pred['box']  # (B, 4, H, W) - already has sigmoid on tx/ty
        cls_pred = pred['cls']  # (B, C, H, W)
        
        B, _, H, W = box_pred.shape
        
        # Get class scores
        cls_scores = torch.sigmoid(cls_pred)  # (B, C, H, W)
        max_scores, max_classes = cls_scores.max(dim=1)  # (B, H, W)
        
        # Filter by confidence
        mask = max_scores > conf_thresh
        
        for b in range(B):
            b_mask = mask[b]
            if not b_mask.any():
                continue
            
            # Get grid positions where confidence > threshold
            y_indices, x_indices = torch.where(b_mask)
            
            # Get predictions at these positions
            tx = box_pred[b, 0, y_indices, x_indices]  # Already sigmoid
            ty = box_pred[b, 1, y_indices, x_indices]  # Already sigmoid
            tw_raw = box_pred[b, 2, y_indices, x_indices]  # Raw logits
            th_raw = box_pred[b, 3, y_indices, x_indices]  # Raw logits
            
            # Apply exp to width/height (matching loss function)
            tw = torch.exp(tw_raw)
            th = torch.exp(th_raw)
            
            # Decode to pixel coordinates
            cx = (x_indices.float() + tx) * stride
            cy = (y_indices.float() + ty) * stride
            w = tw * stride
            h = th * stride
            
            # Convert to xyxy format
            x1 = cx - w / 2
            y1 = cy - h / 2
            x2 = cx + w / 2
            y2 = cy + h / 2
            
            # Clamp to image bounds
            x1 = torch.clamp(x1, 0, img_size)
            y1 = torch.clamp(y1, 0, img_size)
            x2 = torch.clamp(x2, 0, img_size)
            y2 = torch.clamp(y2, 0, img_size)
            
            boxes = torch.stack([x1, y1, x2, y2], dim=1)
            scores = max_scores[b, y_indices, x_indices]
            classes = max_classes[b, y_indices, x_indices]
            
            all_boxes.append(boxes)
            all_scores.append(scores)
            all_classes.append(classes)
    
    if len(all_boxes) == 0:
        return torch.zeros((0, 4)), torch.zeros((0,)), torch.zeros((0,))
    
    all_boxes = torch.cat(all_boxes, dim=0)
    all_scores = torch.cat(all_scores, dim=0)
    all_classes = torch.cat(all_classes, dim=0)
    
    return all_boxes, all_scores, all_classes


def visualize_predictions(image, boxes, scores, classes, class_names, output_path):
    """Draw bounding boxes on image"""
    img = image.copy()
    
    colors = [
        (0, 255, 0),    # sidewalk - green
        (0, 0, 255),    # obstacle - red
        (255, 255, 0),  # curb_ramp - cyan
        (255, 0, 255)   # surface_defect - magenta
    ]
    
    for box, score, cls in zip(boxes, scores, classes):
        x1, y1, x2, y2 = box.cpu().numpy().astype(int)
        cls_idx = int(cls.item())
        score_val = score.item()
        
        color = colors[cls_idx % len(colors)]
        
        # Draw box
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        label = f"{class_names[cls_idx]}: {score_val:.2f}"
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img, (x1, y1 - 20), (x1 + w, y1), color, -1)
        cv2.putText(img, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    cv2.imwrite(str(output_path), img)
    return img


def main():
    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Paths
    checkpoint = "experiments/fixed_model/best.pt"
    cfg_path = "config/yolov8_sidewalk.yaml"
    data_root = "data_cityscapes_200"
    output_dir = Path("experiments/fixed_model/predictions")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load model
    print("Loading model...")
    model, cfg = load_model(checkpoint, cfg_path, device)
    class_names = cfg['data']['names']
    
    # Load test dataset (using train split since val is empty)
    print("Loading test images...")
    test_ds = YoloDetSegDataset(data_root, split="train", img_size=640, augment=False)
    
    # Test on first 5 images
    num_test = min(5, len(test_ds))
    print(f"\nTesting on {num_test} images...")
    
    total_predictions = 0
    
    with torch.no_grad():
        for i in range(num_test):
            sample = test_ds[i]
            img_tensor = sample['image']
            boxes_gt = sample['boxes']
            classes_gt = sample['classes']
            img_path = sample['path']
            
            # Run inference
            img_batch = img_tensor.unsqueeze(0).to(device)
            outputs = model(img_batch)
            
            # Decode predictions with higher confidence threshold
            pred_boxes, pred_scores, pred_classes = decode_predictions(
                outputs['preds'], img_size=640, conf_thresh=0.6
            )
            
            # Apply NMS per class to reduce overlapping boxes
            if len(pred_boxes) > 0:
                keep_indices = []
                unique_classes = pred_classes.unique()
                
                for cls in unique_classes:
                    cls_mask = pred_classes == cls
                    cls_boxes = pred_boxes[cls_mask]
                    cls_scores = pred_scores[cls_mask]
                    cls_indices = torch.where(cls_mask)[0]
                    
                    # Apply NMS with IoU threshold 0.4
                    nms_keep = nms(cls_boxes, cls_scores, iou_threshold=0.4)
                    keep_indices.extend(cls_indices[nms_keep].tolist())
                
                keep_indices = torch.tensor(keep_indices, dtype=torch.long)
                pred_boxes = pred_boxes[keep_indices]
                pred_scores = pred_scores[keep_indices]
                pred_classes = pred_classes[keep_indices]
            
            # Load original image for visualization
            img_bgr = cv2.imread(img_path)
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            
            # Resize to 640x640 for visualization (matching model input)
            h, w = img_rgb.shape[:2]
            scale = 640 / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img_resized = cv2.resize(img_rgb, (new_w, new_h))
            
            # Create canvas
            canvas = np.zeros((640, 640, 3), dtype=np.uint8)
            canvas[:new_h, :new_w] = img_resized
            
            # Visualize
            output_path = output_dir / f"pred_{i:03d}.jpg"
            visualize_predictions(canvas, pred_boxes, pred_scores, pred_classes, 
                                class_names, output_path)
            
            num_preds = len(pred_boxes)
            total_predictions += num_preds
            
            print(f"Image {i+1}/{num_test}: {num_preds} predictions")
            if num_preds > 0:
                print(f"  Box sizes (w×h): ", end="")
                for box in pred_boxes[:3]:  # Show first 3
                    x1, y1, x2, y2 = box.cpu().numpy()
                    w_box = x2 - x1
                    h_box = y2 - y1
                    print(f"{w_box:.0f}×{h_box:.0f} ", end="")
                print()
            print(f"  Saved: {output_path}")
    
    print(f"\n{'='*60}")
    print(f"Testing complete!")
    print(f"Total predictions: {total_predictions}")
    print(f"Average per image: {total_predictions / num_test:.1f}")
    print(f"Predictions saved to: {output_dir}")
    
    if total_predictions == 0:
        print("\n⚠️  WARNING: No predictions found!")
        print("This could mean:")
        print("  - Confidence threshold too high (try lowering from 0.3)")
        print("  - Model not trained enough")
        print("  - Model still has issues")
    else:
        print("\n✓ Model is generating predictions with real box sizes!")


if __name__ == "__main__":
    main()
