import os
from PIL import Image

def optimize_image(filepath, max_width, quality=80):
    try:
        img = Image.open(filepath)
        original_size = os.path.getsize(filepath)
        
        # Calculate new dimensions keeping aspect ratio
        width, height = img.size
        if width > max_width:
            new_height = int(height * (max_width / width))
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"Resized {os.path.basename(filepath)} from {width}x{height} to {max_width}x{new_height}")
        
        # Save based on extension
        ext = os.path.splitext(filepath)[1].lower()
        if ext in ['.jpg', '.jpeg']:
            img.save(filepath, 'JPEG', quality=quality, optimize=True)
        elif ext == '.png':
            # Keep transparency
            img.save(filepath, 'PNG', optimize=True)
            
        new_size = os.path.getsize(filepath)
        reduction = (original_size - new_size) / original_size * 100
        print(f"Optimized {os.path.basename(filepath)}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% reduction)")
    except Exception as e:
        print(f"Error optimizing {filepath}: {e}")

def main():
    workspace = "."
    print("Starting H5 image assets optimization...")
    
    # 1. Optimize Classic Painter Molly
    painter_path = os.path.join(workspace, '泡泡玛特添加素材“经典小画家Molly”.jpg')
    if os.path.exists(painter_path):
        optimize_image(painter_path, max_width=600, quality=80)
        
    # 2. Optimize QR Code
    qr_path = os.path.join(workspace, '二维码.png')
    if os.path.exists(qr_path):
        optimize_image(qr_path, max_width=300)
        
    # 3. Optimize Angry Molly Images (PNGs with transparency)
    angry_dir = os.path.join(workspace, 'Angry Molly白底图')
    if os.path.exists(angry_dir):
        for filename in os.listdir(angry_dir):
            if filename.lower().endswith('.png'):
                filepath = os.path.join(angry_dir, filename)
                optimize_image(filepath, max_width=600)
                
    # 4. Optimize the 30 new blind box images
    for filename in os.listdir(workspace):
        if filename.startswith('微信图片_') and filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            filepath = os.path.join(workspace, filename)
            optimize_image(filepath, max_width=500, quality=75)

    print("Image optimization completed!")

if __name__ == '__main__':
    main()
