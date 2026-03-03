"""Post-processing utilities for YOLOv8 inference"""
import torch
import numpy as np
from typing import List, Dict, Tuple
import cv2


def post_process_detections(
    outputs: Dict[str, torch.Tensor],
    orig_size: Tuple[int, int],
    conf_thresh: float = 0.25,
    iou_thresh: float = 0.45,
    class_names: List[str] = None
) -> List[Dict]:
    """
    Post-process YOLOv8 model outputs to get final detections.
    
    Args:
        outputs: Model output dict with 'preds' and 'proto'
        orig_size: Original image size (H, W)
        conf_thresh: Confidence threshold
        iou_thresh: IoU threshold for NMS
        class_names: List of class names
    
    Returns:
        List of detection dictionaries
    """
    if class_names is None:
        class_names = ["sidewalk", "obstacle", "curb_ramp", "surface_defect"]
    
    preds = outputs['preds']
    proto = outputs['proto']  # (1, 32, 128, 128)
    
    all_detections = []
    
    # Process each pyramid level
    for level_name, pred in preds.items():
        # pred shape: (batch, num_anchors, 4+num_classes+num_coeffs)
        # We assume batch=1
        pred = pred[0]  # Remove batch dimension
        
        # Split predictions
        num_classes = len(class_names)
        boxes = pred[:, :4]  # (N, 4) - cx, cy, w, h normalized
        class_scores = pred[:, 4:4+num_classes]  # (N, num_classes)
        coeffs = pred[:, 4+num_classes:]  # (N, 32) - mask coefficients
        
        # Get class predictions
        max_scores, class_ids = torch.max(class_scores, dim=1)
        
        # Filter by confidence
        conf_mask = max_scores > conf_thresh
        if conf_mask.sum() == 0:
            continue
        
        boxes = boxes[conf_mask]
        class_ids = class_ids[conf_mask]
        max_scores = max_scores[conf_mask]
        coeffs = coeffs[conf_mask]
        
        # Convert boxes to xyxy format and scale to original image
        boxes_xyxy = box_cxcywh_to_xyxy_scale(boxes, orig_size, pred.shape[0])
        
        # Apply NMS
        keep_indices = nms(boxes_xyxy, max_scores, iou_thresh)
        
        for idx in keep_indices:
            detection = {
                "class_name": class_names[class_ids[idx].item()],
                "confidence": round(max_scores[idx].item(), 3),
                "bbox": boxes_xyxy[idx].cpu().numpy().tolist(),
                "segmentation_mask": None,  # TODO: Generate mask from coeffs + proto
                "area": calculate_box_area(boxes_xyxy[idx]),
                "width_estimate": None  # TODO: Calculate for sidewalks
            }
            
            # Estimate sidewalk width (simple heuristic)
            if detection["class_name"] == "sidewalk":
                bbox = boxes_xyxy[idx].cpu().numpy()
                width_px = bbox[2] - bbox[0]
                # Rough estimate: 1 meter ≈ 50 pixels (adjust based on Street View calibration)
                detection["width_estimate"] = round(width_px / 50.0, 2)
            
            all_detections.append(detection)
    
    return all_detections


def box_cxcywh_to_xyxy_scale(boxes: torch.Tensor, orig_size: Tuple[int, int], grid_size: int) -> torch.Tensor:
    """
    Convert normalized center-x,y,w,h to scaled x1,y1,x2,y2.
    
    Args:
        boxes: (N, 4) tensor with cx, cy, w, h in [0, 1]
        orig_size: (H, W) of original image
        grid_size: Size of the prediction grid
    
    Returns:
        (N, 4) tensor with x1, y1, x2, y2 in pixel coordinates
    """
    cx, cy, w, h = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    
    # Convert to corners
    x1 = cx - w / 2
    y1 = cy - h / 2
    x2 = cx + w / 2
    y2 = cy + h / 2
    
    # Scale to original image size
    orig_h, orig_w = orig_size
    x1 = x1 * orig_w
    y1 = y1 * orig_h
    x2 = x2 * orig_w
    y2 = y2 * orig_h
    
    return torch.stack([x1, y1, x2, y2], dim=1)


def nms(boxes: torch.Tensor, scores: torch.Tensor, iou_thresh: float) -> List[int]:
    """
    Non-Maximum Suppression.
    
    Args:
        boxes: (N, 4) tensor with x1, y1, x2, y2
        scores: (N,) confidence scores
        iou_thresh: IoU threshold
    
    Returns:
        List of indices to keep
    """
    if boxes.numel() == 0:
        return []
    
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    
    areas = (x2 - x1) * (y2 - y1)
    _, order = scores.sort(descending=True)
    
    keep = []
    while order.numel() > 0:
        if order.numel() == 1:
            keep.append(order.item())
            break
        
        i = order[0].item()
        keep.append(i)
        
        # Calculate IoU with remaining boxes
        xx1 = torch.max(x1[i], x1[order[1:]])
        yy1 = torch.max(y1[i], y1[order[1:]])
        xx2 = torch.min(x2[i], x2[order[1:]])
        yy2 = torch.min(y2[i], y2[order[1:]])
        
        w = torch.clamp(xx2 - xx1, min=0)
        h = torch.clamp(yy2 - yy1, min=0)
        intersection = w * h
        
        iou = intersection / (areas[i] + areas[order[1:]] - intersection)
        
        # Keep boxes with IoU below threshold
        mask = iou <= iou_thresh
        order = order[1:][mask]
    
    return keep


def calculate_box_area(box: torch.Tensor) -> float:
    """Calculate area of bounding box"""
    x1, y1, x2, y2 = box.cpu().numpy()
    return float((x2 - x1) * (y2 - y1))
