from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder_image(repair_id, text, size=(800, 600)):
    # Create a new image with a gradient background
    image = Image.new('RGB', size, '#ffffff')
    draw = ImageDraw.Draw(image)
    
    # Create gradient background
    for y in range(size[1]):
        r = int(240 - (y / size[1]) * 20)
        g = int(240 - (y / size[1]) * 20)
        b = int(240 - (y / size[1]) * 20)
        for x in range(size[0]):
            draw.point((x, y), fill=(r, g, b))
    
    # Try multiple font options
    font_size = 48
    font = None
    font_options = [
        "Arial", "DejaVuSans", "FreeSans",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc"
    ]
    
    for font_name in font_options:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except:
            continue
    
    if font is None:
        font = ImageFont.load_default()
        font_size = 24  # Adjust size for default font
    
    # Add a subtle border
    border_width = 4
    draw.rectangle([0, 0, size[0]-1, size[1]-1], outline='#dddddd', width=border_width)
    
    # Draw text with shadow effect
    text = f"Repair {repair_id}\n{text}"
    shadow_offset = 2
    
    # Draw shadow
    draw.multiline_text(
        (size[0]/2 + shadow_offset, size[1]/2 + shadow_offset),
        text,
        font=font,
        fill='#cccccc',
        anchor="mm",
        align="center"
    )
    
    # Draw main text
    draw.multiline_text(
        (size[0]/2, size[1]/2),
        text,
        font=font,
        fill='#333333',
        anchor="mm",
        align="center"
    )
    
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
