# AccessNav ML API

FastAPI inference endpoint for YOLOv8-based accessibility detection.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure you have a trained model checkpoint at:
```
src/neural-network/experiments/debug_run/best.pt
```

## Running the API

Development mode:
```bash
python app.py
```

Production mode with Uvicorn:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
```
GET /
```

### Analyze Image
```
POST /api/v1/analyze
Content-Type: multipart/form-data

Body: file (image file - jpg, png)
```

**Response:**
```json
{
  "detections": [
    {
      "class_name": "sidewalk",
      "confidence": 0.92,
      "bbox": [10.5, 20.3, 450.2, 580.1],
      "segmentation_mask": null,
      "area": 246420.5,
      "width_estimate": 2.5
    },
    {
      "class_name": "obstacle",
      "confidence": 0.87,
      "bbox": [200.1, 150.2, 280.5, 220.8],
      "area": 5676.3,
      "width_estimate": null
    }
  ],
  "image_metadata": {
    "width": 640,
    "height": 640,
    "sidewalk_coverage": 0.601,
    "num_obstacles": 2,
    "num_ramps": 1,
    "num_defects": 0
  },
  "processing_time_ms": 145.23
}
```

## Testing

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -F "file=@test_image.jpg"
```

## Deployment

### Railway
1. Create `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn app:app --host 0.0.0.0 --port $PORT"
```

2. Push to Railway:
```bash
railway up
```

### Docker
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Environment Variables

- `MODEL_PATH`: Path to checkpoint (default: `experiments/debug_run/best.pt`)
- `DEVICE`: `cuda:0` or `cpu` (auto-detected if not set)
- `CONF_THRESH`: Confidence threshold (default: 0.25)
- `IOU_THRESH`: NMS IoU threshold (default: 0.45)
