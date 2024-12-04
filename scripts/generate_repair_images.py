from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder_image(repair_id, text, size=(800, 600)):
    # Create a new image with a light gray background
    image = Image.new('RGB', size, '#f0f0f0')
    draw = ImageDraw.Draw(image)
    
    # Add repair ID text
    font_size = 48
    try:
        font = ImageFont.truetype("Arial", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw text in the center
    text = f"Repair {repair_id}\n{text}"
    text_bbox = draw.multiline_textbbox((size[0]/2, size[1]/2), text, font=font, anchor="mm", align="center")
    draw.multiline_text((size[0]/2, size[1]/2), text, font=font, fill='#333333', anchor="mm", align="center")
    
    return image

def main():
    # Create repairs directory if it doesn't exist
    os.makedirs('client/public/repairs', exist_ok=True)
    
    # Generate images for each repair
    repairs = [
        ('471', 'Alignment Issues'),
        ('470', 'Transmission Issues'),
        ('467', 'Body Damage'),
        ('465', 'Electrical Issues'),
        ('464', 'Oil Change'),
        ('462', 'Window/Lock Problems')
    ]
    
    for repair_id, category in repairs:
        img = create_placeholder_image(repair_id, category)
        img.save(f'client/public/repairs/repair-{repair_id}.jpg')
        print(f'Generated repair-{repair_id}.jpg')

if __name__ == '__main__':
    main()
