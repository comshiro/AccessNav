# train.py
import argparse
import yaml
from pathlib import Path
import torch
from torch.utils.data import DataLoader
from torch.cuda.amp import autocast, GradScaler
import time

from models.yolo import YOLOSegModel
from utils.data_loader import YoloDetSegDataset, collate_fn
from utils.targets import build_targets
from utils.loss import DetectionSegLoss

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cfg", type=str, default="config/yolov8_sidewalk.yaml")
    ap.add_argument("--data_root", type=str, default="data") 
    ap.add_argument("--epochs", type=int, default=10)
    ap.add_argument("--batch", type=int, default=4)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--lr", type=float, default=0.001)  # Changed from 0.01 to 0.001
    ap.add_argument("--device", type=str, default="cuda:0")
    ap.add_argument("--save_dir", type=str, default="experiments/debug_run")
    ap.add_argument("--debug", type=int, default=0)
    ap.add_argument("--resume", type=str, default="", help="Path to checkpoint to resume from")
    return ap.parse_args()

def load_cfg(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)

def main():
    args = parse_args()
    cfg = load_cfg(args.cfg)

    device = torch.device(args.device if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    num_classes = len(cfg["data"]["names"])

    # Model
    model = YOLOSegModel(cfg["model"], num_classes)
    print("Model params:", sum(p.numel() for p in model.parameters())/1e6, "M")

    # Dataset with augmentation enabled
    train_ds = YoloDetSegDataset(args.data_root, split="train", img_size=args.imgsz, augment=True)
    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True,
                              num_workers=0, collate_fn=collate_fn)  # num_workers=0 for Windows
    
    # Loss with rebalanced weights
    loss_fn = DetectionSegLoss(num_classes=num_classes, box_weight=2.5, cls_weight=0.5, mask_weight=1.0)
    
    # AdamW optimizer with lower learning rate and weight decay
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=5e-5)
    
    # Cosine learning rate scheduler with warmup
    from torch.optim.lr_scheduler import CosineAnnealingLR
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=args.lr * 0.01)
    
    scaler = GradScaler(enabled=True)
    
    start_epoch = 0
    best_loss = float('inf')
    
    # Resume from checkpoint if provided
    if args.resume:
        print(f"Resuming from checkpoint: {args.resume}")
        ckpt = torch.load(args.resume, map_location='cpu')
        model.load_state_dict(ckpt['model'])
        model.to(device)
        if 'optimizer' in ckpt:
            optimizer.load_state_dict(ckpt['optimizer'])
            # Move optimizer states to device
            for state in optimizer.state.values():
                for k, v in state.items():
                    if isinstance(v, torch.Tensor):
                        state[k] = v.to(device)
        if 'scheduler' in ckpt:
            scheduler.load_state_dict(ckpt['scheduler'])
        if 'epoch' in ckpt:
            start_epoch = ckpt['epoch']
        if 'loss' in ckpt:
            best_loss = ckpt['loss']
        print(f"Resumed from epoch {start_epoch}, best loss: {best_loss:.4f}")
    else:
        model.to(device) 

    save_dir = Path(args.save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    model.train()
    print(f"\nStarting training from epoch {start_epoch + 1} to {args.epochs}...")
    
    for epoch in range(start_epoch, args.epochs):
        t0 = time.time()
        running = 0.0
        model.train()
        
        for it, (images, batch_boxes, batch_classes, paths) in enumerate(train_loader):
            images = images.to(device)
            
            # Debug: print device info on first batch of first epoch
            if epoch == start_epoch and it == 0:
                print(f"Batch 0 images device: {images.device}")
            
            optimizer.zero_grad(set_to_none=True)
            
            with autocast(enabled=True):
                outputs = model(images)  # {"preds":{...}, "proto":...}
                targets = build_targets(batch_boxes, batch_classes, args.imgsz, device, num_classes)
                loss, parts = loss_fn(outputs["preds"], targets, outputs["proto"])
            
            # Gradient clipping to prevent explosion
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=10.0)
            scaler.step(optimizer)
            scaler.update()

            running += loss.item()
            
            if args.debug and it >= args.debug - 1:
                break

            if it % 10 == 0:
                print(f"[Epoch {epoch+1}/{args.epochs}] Iter {it} loss={loss.item():.4f} "
                      f"(box={parts['loss_box']:.3f} cls={parts['loss_cls']:.3f})")

        avg_loss = running / max(1, (it + 1))
        dt = time.time() - t0
        current_lr = optimizer.param_groups[0]['lr']
        print(f"Epoch {epoch+1} done. Avg loss={avg_loss:.4f} time={dt:.1f}s lr={current_lr:.6f}")
        
        # Step scheduler
        scheduler.step()
        
        # Save checkpoint
        ckpt_path = save_dir / f"epoch_{epoch+1}.pt"
        torch.save({
            "model": model.state_dict(),
            "optimizer": optimizer.state_dict(),
            "scheduler": scheduler.state_dict(),
            "epoch": epoch + 1,
            "loss": avg_loss
        }, ckpt_path)
        
        # Save best model
        if avg_loss < best_loss:
            best_loss = avg_loss
            best_path = save_dir / "best.pt"
            torch.save({
                "model": model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "scheduler": scheduler.state_dict(),
                "epoch": epoch + 1,
                "loss": best_loss
            }, best_path)
            print(f"  → Best model saved with loss={best_loss:.4f}")

    print(f"\nTraining completed! Best loss: {best_loss:.4f}")

if __name__ == "__main__":
    main()
