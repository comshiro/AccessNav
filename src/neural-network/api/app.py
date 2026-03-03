from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import torch
import cv2
import numpy as np
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from models.yolo import YOLOSegModel
from utils.inference import post_process_detections
from config.yolov8_sidewalk import load_config

app = FastAPI(
    title="AccessNav ML API",
    description="YOLOv8-based accessibility detection for sidewalk analysis",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]
    segmentation_mask: Optional[List[List[float]]] = None
    area: Optional[float] = None
    width_estimate: Optional[float] = None

class ImageMetadata(BaseModel):
    width: int
    height: int
    sidewalk_coverage: float
    num_obstacles: int
    num_ramps: int
    num_defects: int

class AnalysisResponse(BaseModel):
    detections: List[Detection]
    image_metadata: ImageMetadata
    processing_time_ms: float

# Global model instance
model = None
device = None
class_names = ["sidewalk", "obstacle", "curb_ramp", "surface_defect"]

@app.on_event("startup")
async def load_model():
    """Load YOLOv8 model on startup"""
    global model, device
    
    try:
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {device}")
        
        # Load config
        config_path = Path(__file__).parent.parent / "config" / "yolov8_sidewalk.yaml"
        model_cfg = load_config(str(config_path))
        
        # Initialize model
        model = YOLOSegModel(model_cfg, num_classes=4)
        
        # Load checkpoint
        checkpoint_path = Path(__file__).parent.parent / "experiments" / "debug_run" / "best.pt"
        if checkpoint_path.exists():
            checkpoint = torch.load(checkpoint_path, map_location=device)
            model.load_state_dict(checkpoint['model'])
            print(f"Loaded checkpoint from {checkpoint_path}")
        else:
            print(f"Warning: No checkpoint found at {checkpoint_path}")
            print("Model initialized with random weights (for testing only)")
        
        model.to(device)
        model.eval()
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        import traceback
        traceback.print_exc()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "model_loaded": model is not None,
        "device": str(device),
        "version": "1.0.0"
    }

@app.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze a Street View image for accessibility features.
    
    Returns detected sidewalks, obstacles, curb ramps, and surface defects.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        import time
        start_time = time.time()
        
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        orig_h, orig_w = img_rgb.shape[:2]
        print(f"Original image size: {orig_h}x{orig_w}")
        
        # Preprocess
        img_resized = preprocess_image(img_rgb, target_size=640)
        print(f"Resized image shape: {img_resized.shape}")
        img_tensor = torch.from_numpy(img_resized).permute(2, 0, 1).float() / 255.0
        img_tensor = img_tensor.unsqueeze(0).to(device)
        print(f"Input tensor shape: {img_tensor.shape}")
        
        # Inference
        with torch.no_grad():
            outputs = model(img_tensor)
        
        print(f"Model inference complete")
        
        # For now, return mock detections since model has random weights
        # TODO: Replace with real post-processing once model is trained
        detections = [
            Detection(
                class_name="sidewalk",
                confidence=0.85,
                bbox=[100.0, 200.0, 500.0, 600.0],
                segmentation_mask=None,
                area=240000.0,
                width_estimate=8.0
            )
        ]
        
        print(f"Created mock detections")
        
        # Calculate metadata
        metadata = ImageMetadata(
            width=orig_w,
            height=orig_h,
            sidewalk_coverage=0.586,
            num_obstacles=0,
            num_ramps=0,
            num_defects=0
        )
        
        print(f"Created metadata")
        
        processing_time = (time.time() - start_time) * 1000
        
        print(f"Returning response, processing time: {processing_time}ms")
        
        return AnalysisResponse(
            detections=detections,
            image_metadata=metadata,
            processing_time_ms=round(processing_time, 2)
        )
        
        # Original post-processing code (commented out until model is trained):
        """
        # Debug: Print output structure
        print(f"Model outputs keys: {outputs.keys()}")
        print(f"Preds type: {type(outputs['preds'])}")
        if isinstance(outputs['preds'], list):
            print(f"Number of pyramid levels: {len(outputs['preds'])}")
            for i, pred in enumerate(outputs['preds']):
                print(f"  Level {i}: {type(pred)}, keys: {pred.keys() if isinstance(pred, dict) else 'N/A'}")
        
        # Convert head output format to match inference expectations
        # Head returns list of dicts with 'box', 'cls', 'coef' keys
        # Need to concatenate them into single tensor per level
        formatted_preds = {}
        level_names = ['P3', 'P4', 'P5', 'P6']
        for i, pred_dict in enumerate(outputs['preds']):
            # pred_dict has: box (B,4,H,W), cls (B,num_classes,H,W), coef (B,num_coeffs,H,W)
            box = pred_dict['box']  # (1, 4, H, W)
            cls = pred_dict['cls']  # (1, 4, H, W)
            coef = pred_dict['coef']  # (1, 32, H, W)
            
            # Concatenate along channel dim and reshape to (B, H*W, 4+num_classes+num_coeffs)
            B, _, H, W = box.shape
            box = box.permute(0, 2, 3, 1).reshape(B, H*W, 4)  # (1, H*W, 4)
            cls = cls.permute(0, 2, 3, 1).reshape(B, H*W, cls.shape[1])  # (1, H*W, num_classes)
            coef = coef.permute(0, 2, 3, 1).reshape(B, H*W, coef.shape[1])  # (1, H*W, 32)
            
            # Concatenate: [box, cls, coef]
            formatted_preds[level_names[i]] = torch.cat([box, cls, coef], dim=2)  # (1, H*W, 4+4+32)
        
        formatted_outputs = {
            'preds': formatted_preds,
            'proto': outputs['proto']
        }
        
        # Post-process
        detections = post_process_detections(
            formatted_outputs, 
            orig_size=(orig_h, orig_w),
            conf_thresh=0.25,
            iou_thresh=0.45,
            class_names=class_names
        )
        
        # Calculate metadata
        metadata = calculate_metadata(detections, orig_h, orig_w)
        
        processing_time = (time.time() - start_time) * 1000
        
        return AnalysisResponse(
            detections=detections,
            image_metadata=metadata,
            processing_time_ms=round(processing_time, 2)
        )
        """
        
    except Exception as e:
        import traceback
        error_detail = f"Processing error: {type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=error_detail[:500])

def preprocess_image(img: np.ndarray, target_size: int = 640) -> np.ndarray:
    """Resize and pad image to target size"""
    h, w = img.shape[:2]
    scale = min(target_size / h, target_size / w)
    nh, nw = int(h * scale), int(w * scale)
    
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    canvas[:nh, :nw] = resized
    
    return canvas

def calculate_metadata(detections: List[Detection], img_h: int, img_w: int) -> ImageMetadata:
    """Calculate image-level metadata from detections"""
    total_pixels = img_h * img_w
    sidewalk_pixels = 0
    num_obstacles = 0
    num_ramps = 0
    num_defects = 0
    
    for det in detections:
        if det.class_name == "sidewalk" and det.area:
            sidewalk_pixels += det.area
        elif det.class_name == "obstacle":
            num_obstacles += 1
        elif det.class_name == "curb_ramp":
            num_ramps += 1
        elif det.class_name == "surface_defect":
            num_defects += 1
    
    sidewalk_coverage = sidewalk_pixels / total_pixels if total_pixels > 0 else 0.0
    
    return ImageMetadata(
        width=img_w,
        height=img_h,
        sidewalk_coverage=round(sidewalk_coverage, 3),
        num_obstacles=num_obstacles,
        num_ramps=num_ramps,
        num_defects=num_defects
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="debug")
