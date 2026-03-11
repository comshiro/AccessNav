"""
Split Cityscapes dataset into train/val sets
"""
import shutil
from pathlib import Path
import random

def split_dataset(data_root, train_ratio=0.8):
    """Split images into train/val sets"""
    data_root = Path(data_root)
    train_dir = data_root / "images" / "train"
    val_dir = data_root / "images" / "val"
    
    train_labels_dir = data_root / "labels" / "train"
    val_labels_dir = data_root / "labels" / "val"
    
    # Get all images currently in train
    all_images = list(train_dir.glob("*.png")) + list(train_dir.glob("*.jpg"))
    print(f"Found {len(all_images)} images in train/")
    
    # Shuffle and split
    random.seed(42)  # For reproducibility
    random.shuffle(all_images)
    
    split_idx = int(len(all_images) * train_ratio)
    train_images = all_images[:split_idx]
    val_images = all_images[split_idx:]
    
    print(f"Splitting into {len(train_images)} train, {len(val_images)} val")
    
    # Create val directories if they don't exist
    val_dir.mkdir(parents=True, exist_ok=True)
    val_labels_dir.mkdir(parents=True, exist_ok=True)
    
    # Move validation images and labels
    for img_path in val_images:
        # Move image
        new_img_path = val_dir / img_path.name
        shutil.move(str(img_path), str(new_img_path))
        
        # Move corresponding label
        label_name = img_path.stem + ".txt"
        label_path = train_labels_dir / label_name
        if label_path.exists():
            new_label_path = val_labels_dir / label_name
            shutil.move(str(label_path), str(new_label_path))
    
    print(f"✓ Split complete!")
    print(f"  Train: {len(list(train_dir.glob('*')))} images")
    print(f"  Val: {len(list(val_dir.glob('*')))} images")

if __name__ == "__main__":
    # Split the 1000-image dataset
    split_dataset("data_cityscapes", train_ratio=0.8)
