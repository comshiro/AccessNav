"""
Download and convert Cityscapes dataset to YOLO format

Steps:
1. Register at https://www.cityscapes-dataset.com/
2. Download leftImg8bit_trainvaltest.zip (11GB - images)
3. Download gtFine_trainvaltest.zip (241MB - annotations)
4. Run this script to convert to YOLO format

Cityscapes classes relevant for AccessNav:
- sidewalk (class 1)
- terrain (class 9) 
- pole (class 5) - obstacles
- traffic sign (class 7) - obstacles
"""

import json
import os
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

# Cityscapes label names we care about
CITYSCAPES_TO_YOLO = {
    "sidewalk": 0,      # sidewalk -> sidewalk
    "terrain": 0,       # terrain -> sidewalk (walkable areas)
    "pole": 1,          # pole -> obstacle
    "traffic sign": 1,  # traffic sign -> obstacle
}

def convert_polygon_to_bbox(polygon, img_width, img_height):
    """Convert polygon to YOLO bounding box format (normalized cx, cy, w, h)"""
    # Polygon is list of [x, y] points
    points = np.array(polygon).reshape(-1, 2)
    
    x_min = points[:, 0].min()
    x_max = points[:, 0].max()
    y_min = points[:, 1].min()
    y_max = points[:, 1].max()
    
    # Convert to YOLO format (normalized center coordinates and size)
    cx = ((x_min + x_max) / 2) / img_width
    cy = ((y_min + y_max) / 2) / img_height
    w = (x_max - x_min) / img_width
    h = (y_max - y_min) / img_height
    
    return cx, cy, w, h

def convert_cityscapes_to_yolo(cityscapes_root, output_root, max_images=500):
    """
    Convert Cityscapes dataset to YOLO format
    
    Args:
        cityscapes_root: Path to extracted Cityscapes (contains leftImg8bit/ and gtFine/)
        output_root: Path to save converted dataset
        max_images: Maximum number of images to convert
    """
    cityscapes_root = Path(cityscapes_root)
    output_root = Path(output_root)
    
    # Create output directories
    (output_root / "images" / "train").mkdir(parents=True, exist_ok=True)
    (output_root / "images" / "val").mkdir(parents=True, exist_ok=True)
    (output_root / "labels" / "train").mkdir(parents=True, exist_ok=True)
    (output_root / "labels" / "val").mkdir(parents=True, exist_ok=True)
    
    converted_count = 0
    
    for split in ["train", "val"]:
        print(f"\nProcessing {split} split...")
        
        # Find all JSON annotation files
        json_dir = cityscapes_root / "gtFine" / split
        print(f"  Looking in: {json_dir}")
        if not json_dir.exists():
            print(f"  Warning: {json_dir} not found, skipping")
            continue
            
        json_files = list(json_dir.rglob("*_gtFine_polygons.json"))
        print(f"  Found {len(json_files)} annotation files")
        
        for json_path in json_files:
            if converted_count >= max_images:
                print(f"\nReached max_images limit ({max_images}), stopping")
                return converted_count
            
            # Load JSON annotation
            with open(json_path) as f:
                data = json.load(f)
            
            img_width = data["imgWidth"]
            img_height = data["imgHeight"]
            
            # Find corresponding image
            img_name = json_path.stem.replace("_gtFine_polygons", "_leftImg8bit")
            img_path = cityscapes_root / "leftImg8bit" / split / json_path.parent.name / f"{img_name}.png"
            
            if not img_path.exists():
                continue
            
            # Extract bounding boxes from polygons
            yolo_annotations = []
            
            for obj in data["objects"]:
                label_id = obj["label"]
                
                # Check if this is a class we care about
                if label_id not in CITYSCAPES_TO_YOLO:
                    continue
                
                yolo_class = CITYSCAPES_TO_YOLO[label_id]
                polygon = obj["polygon"]
                
                # Convert polygon to bbox
                cx, cy, w, h = convert_polygon_to_bbox(polygon, img_width, img_height)
                
                # Skip very small boxes (likely noise)
                if w < 0.01 or h < 0.01:
                    continue
                
                yolo_annotations.append(f"{yolo_class} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
            
            # Skip images with no relevant annotations
            if not yolo_annotations:
                continue
            
            # Copy image
            output_img_path = output_root / "images" / split / f"{img_name}.png"
            img = cv2.imread(str(img_path))
            cv2.imwrite(str(output_img_path), img)
            
            # Write YOLO label file
            output_label_path = output_root / "labels" / split / f"{img_name}.txt"
            with open(output_label_path, "w") as f:
                f.write("\n".join(yolo_annotations))
            
            converted_count += 1
            if converted_count % 50 == 0:
                print(f"  Converted {converted_count} images...")
    
    return converted_count

if __name__ == "__main__":
    print("Cityscapes to YOLO Converter")
    print("=" * 50)
    print("\nBefore running this script:")
    print("1. Register at https://www.cityscapes-dataset.com/")
    print("2. Download leftImg8bit_trainvaltest.zip")
    print("3. Download gtFine_trainvaltest.zip")
    print("4. Extract both to a folder (e.g., E:\\Cityscapes)")
    print("\nExpected structure:")
    print("  E:\\Cityscapes\\")
    print("    ├── leftImg8bit\\")
    print("    │   ├── train\\")
    print("    │   └── val\\")
    print("    └── gtFine\\")
    print("        ├── train\\")
    print("        └── val\\")
    print("\n" + "=" * 50)
    
    # Get paths from user
    cityscapes_path = input("\nEnter path to Cityscapes folder (e.g., E:\\Cityscapes): ").strip()
    
    if not cityscapes_path:
        print("Error: Path cannot be empty!")
        exit(1)
    
    cityscapes_path = Path(cityscapes_path)
    if not cityscapes_path.exists():
        print(f"Error: Path {cityscapes_path} does not exist!")
        exit(1)
    
    print(f"Using Cityscapes path: {cityscapes_path.absolute()}")
    
    output_path = Path("data_cityscapes")
    max_imgs = int(input("How many images to convert? (recommended: 500-1000): ").strip())
    
    print(f"\nConverting up to {max_imgs} images...")
    print(f"Output will be saved to: {output_path.absolute()}")
    
    count = convert_cityscapes_to_yolo(cityscapes_path, output_path, max_images=max_imgs)
    
    print(f"\n{'='*50}")
    print(f"✅ Conversion complete!")
    print(f"   Converted: {count} images")
    print(f"   Location: {output_path.absolute()}")
    print(f"\nTo use this dataset:")
    print(f"   python train.py --data_root data_cityscapes --epochs 100 --batch 8")
