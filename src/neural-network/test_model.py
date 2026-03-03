"""Test the trained model on a sample image"""
import torch
import cv2
import numpy as np
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent))

from models.yolo import YOLOSegModel
from config.yolov8_sidewalk import load_config

# Load model
config_path = Path("config/yolov8_sidewalk.yaml")
model_cfg = load_config(str(config_path))
model = YOLOSegModel(model_cfg, num_classes=4)

# Load checkpoint
checkpoint = torch.load("experiments/debug_run/best.pt", map_location="cpu")
model.load_state_dict(checkpoint['model'])
model.eval()

print(f"Loaded checkpoint from epoch {checkpoint['epoch']} with loss {checkpoint['loss']:.4f}")

# Load a test image
img_path = Path("data/images/train/sidewalk_015_Bd..jpg")
if not img_path.exists():
    # Try first available image
    img_path = list(Path("data/images/train").glob("*.jpg"))[0]

img = cv2.imread(str(img_path))
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
print(f"Testing on image: {img_path.name}, size: {img.shape}")

# Preprocess
h, w = img_rgb.shape[:2]
scale = min(640/h, 640/w)
nh, nw = int(h*scale), int(w*scale)
resized = cv2.resize(img_rgb, (nw, nh))
canvas = np.zeros((640, 640, 3), dtype=np.uint8)
canvas[:nh, :nw] = resized

# To tensor
img_tensor = torch.from_numpy(canvas).permute(2, 0, 1).float() / 255.0
img_tensor = img_tensor.unsqueeze(0)

# Inference
with torch.no_grad():
    outputs = model(img_tensor)

print("\nModel outputs:")
print(f"  Preds: Dict with keys: {outputs['preds'].keys()}")
for level_name, pred_dict in outputs['preds'].items():
    box = pred_dict['box']
    cls = pred_dict['cls']
    print(f"  {level_name}: box={box.shape}, cls={cls.shape}")
    
    # Check predictions
    cls_probs = torch.sigmoid(cls[0])  # (num_classes, H, W)
    max_probs, _ = cls_probs.max(dim=0)  # (H, W)
    high_conf = (max_probs > 0.5).sum().item()
    print(f"    Max confidence: {max_probs.max():.3f}, High conf cells: {high_conf}")

print(f"\n  Proto: {outputs['proto'].shape}")
print("\nModel is working! It's making predictions.")
print("Note: With only a few epochs and 28 images, predictions may not be accurate yet.")
