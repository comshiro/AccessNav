"""Load YOLOv8 configuration from YAML"""
import yaml
from pathlib import Path


def load_config(config_path: str) -> dict:
    """Load model configuration from YAML file"""
    with open(config_path, 'r') as f:
        cfg = yaml.safe_load(f)
    
    # Extract model parameters
    model_cfg = {
        'num_classes': cfg.get('nc', 4),
        'num_coeffs': cfg.get('num_coeffs', 32),
        'backbone_channels': calculate_backbone_channels(cfg),
        'backbone_depths': cfg.get('backbone_depths', [1, 2, 3, 1]),
        'neck_out_channels': cfg.get('neck_out_channels', 256),
        'proto_out_size': cfg.get('proto_out_size', [128, 128]),
        'proto_channels': cfg.get('proto_channels', 32)
    }
    
    return model_cfg


def calculate_backbone_channels(cfg: dict) -> list:
    """Calculate backbone channel sizes based on depth/width multipliers"""
    base_channels = [64, 128, 256, 512, 1024]
    width_mul = cfg.get('width_multiple', 0.50)
    
    # Apply width multiplier and round to nearest 8
    channels = [make_divisible(c * width_mul, 8) for c in base_channels]
    
    return channels


def make_divisible(x: float, divisor: int = 8) -> int:
    """Make number divisible by divisor"""
    return int(((x + divisor / 2) // divisor) * divisor)
