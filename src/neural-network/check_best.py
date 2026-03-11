import torch

ckpt = torch.load('experiments/cityscapes_1000/best.pt', map_location='cpu', weights_only=False)
print(f"Best model:")
print(f"  Epoch: {ckpt['epoch']}")
print(f"  Loss: {ckpt['loss']:.4f}")
