from PIL import Image, ImageDraw, ImageFont
import os

def create_mobile_interface(filename, title, description, type="normal", size=(400, 800)):
    """
    Create mock mobile interface images for the repair form
    
    Args:
        filename: Output filename
        title: Title to display on the interface
        description: Description text
        type: Type of interface (normal, loading, confirmation)
        size: Image size tuple (width, height)
    """
    # Create a new image with a dark blue background
    image = Image.new('RGB', size, '#1e3a4a')
    draw = ImageDraw.Draw(image)
    
    # Try multiple font options
    title_font_size = 28
    body_font_size = 16
    font = None
    small_font = None
    font_options = [
        "Arial", "DejaVuSans", "FreeSans",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc"
    ]
    
    for font_name in font_options:
        try:
            font = ImageFont.truetype(font_name, title_font_size)
            small_font = ImageFont.truetype(font_name, body_font_size)
            break
        except:
            continue
    
    if font is None:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Add status bar
    draw.rectangle([0, 0, size[0], 30], fill='#0a1b25')
    
    # Add time and battery icons
    draw.text((20, 8), '10:30', fill='white', font=small_font)
    draw.rectangle([size[0]-50, 8, size[0]-15, 22], outline='white', width=1)
    draw.rectangle([size[0]-15, 12, size[0]-10, 18], fill='white')
    
    # Draw main interface elements based on type
    if type == "loading":
        # Loading interface
        # Status circle
        circle_center = (size[0]//2, size[1]//2 - 40)
        circle_radius = 40
        draw.ellipse(
            [
                circle_center[0] - circle_radius, 
                circle_center[1] - circle_radius, 
                circle_center[0] + circle_radius, 
                circle_center[1] + circle_radius
            ],
            outline='#4080ff',
            width=3
        )
        
        # Loading animation
        arc_start = 0
        arc_end = 240
        draw.arc(
            [
                circle_center[0] - circle_radius, 
                circle_center[1] - circle_radius, 
                circle_center[0] + circle_radius, 
                circle_center[1] + circle_radius
            ],
            arc_start, arc_end,
            fill='#4080ff',
            width=3
        )
        
        # Loading text
        draw.text(
            (size[0]//2, size[1]//2 + 40),
            "Loading...",
            font=font,
            fill='white',
            anchor="mm"
        )
        
        draw.text(
            (size[0]//2, size[1]//2 + 80),
            description,
            font=small_font,
            fill='#aaccee',
            anchor="mm",
            align="center"
        )
    
    elif type == "confirmation":
        # Confirmation interface
        # Success icon
        circle_center = (size[0]//2, size[1]//2 - 40)
        circle_radius = 40
        draw.ellipse(
            [
                circle_center[0] - circle_radius, 
                circle_center[1] - circle_radius, 
                circle_center[0] + circle_radius, 
                circle_center[1] + circle_radius
            ],
            fill='#30c060'
        )
        
        # Checkmark
        checkmark_points = [
            (circle_center[0] - 20, circle_center[1]),
            (circle_center[0] - 5, circle_center[1] + 15),
            (circle_center[0] + 20, circle_center[1] - 15)
        ]
        draw.line(checkmark_points, fill='white', width=5)
        
        # Success text
        draw.text(
            (size[0]//2, size[1]//2 + 40),
            "Success!",
            font=font,
            fill='white',
            anchor="mm"
        )
        
        draw.text(
            (size[0]//2, size[1]//2 + 80),
            description,
            font=small_font,
            fill='#aaccee',
            anchor="mm",
            align="center"
        )
        
        # Button
        button_y = size[1]//2 + 150
        draw.rounded_rectangle(
            [size[0]//2 - 80, button_y, size[0]//2 + 80, button_y + 40],
            radius=5,
            fill='#4080ff'
        )
        draw.text(
            (size[0]//2, button_y + 20),
            "Close",
            font=small_font,
            fill='white',
            anchor="mm"
        )
        
    else:
        # Regular interface
        # Header
        draw.rectangle([0, 30, size[0], 90], fill='#0a1b25')
        draw.text((20, 60), title, fill='white', font=font, anchor="lm")
        
        # Back button
        try:
            close_font = ImageFont.truetype(font_options[0], 36)
        except:
            close_font = font
        draw.text((size[0]-20, 60), "×", fill='white', font=close_font, anchor="rm")
        
        # Form elements
        y_offset = 120
        
        # Add form title
        draw.text((20, y_offset), "Report Vehicle Issue", fill='white', font=font)
        y_offset += 50
        
        # Add form fields
        for field_name in ["Vehicle ID", "Issue Type", "Description"]:
            # Field label
            draw.text((20, y_offset), field_name, fill='#aaccee', font=small_font)
            y_offset += 30
            
            # Field input
            draw.rounded_rectangle([20, y_offset, size[0]-20, y_offset+40], radius=5, fill='#2c4c60')
            if field_name == "Issue Type" and title == "Multilingual Support":
                # Show dropdown options for the "Issue Type" field
                draw.text((30, y_offset+20), "Select Issue Type ▼", fill='white', font=small_font, anchor="lm")
            elif field_name == "Description" and title == "Photo Documentation":
                draw.text((30, y_offset+20), "Enter description...", fill='#8899aa', font=small_font, anchor="lm")
            else:
                draw.text((30, y_offset+20), f"Enter {field_name.lower()}...", fill='#8899aa', font=small_font, anchor="lm")
            y_offset += 60
        
        # Add photo upload section for the photo upload screen
        if title == "Photo Documentation":
            draw.text((20, y_offset), "Upload Photos", fill='#aaccee', font=small_font)
            y_offset += 30
            
            # Photo upload area
            draw.rounded_rectangle([20, y_offset, size[0]-20, y_offset+120], radius=5, fill='#2c4c60')
            
            # Camera icon
            camera_center = (size[0]//2, y_offset+60)
            draw.rectangle([camera_center[0]-20, camera_center[1]-15, camera_center[0]+20, camera_center[1]+15], outline='#8899aa', width=2)
            draw.ellipse([camera_center[0]-8, camera_center[1]-8, camera_center[0]+8, camera_center[1]+8], outline='#8899aa', width=2)
            
            draw.text((size[0]//2, y_offset+90), "Tap to add photos", fill='#8899aa', font=small_font, anchor="mm")
            
            y_offset += 140
        
        # Add language toggle for the language support screen
        if title == "Multilingual Support":
            # Language toggle
            toggle_y = y_offset
            draw.rounded_rectangle([20, toggle_y, size[0]-20, toggle_y+40], radius=20, fill='#2c4c60')
            
            # Toggle button position (left for English, right for Spanish)
            toggle_position = 'left'  # or 'right'
            if toggle_position == 'left':
                draw.rounded_rectangle([25, toggle_y+5, (size[0]-20)//2 - 5, toggle_y+35], radius=15, fill='#4080ff')
                left_color = 'white'
                right_color = '#8899aa'
            else:
                draw.rounded_rectangle([(size[0]-20)//2 + 5, toggle_y+5, size[0]-25, toggle_y+35], radius=15, fill='#4080ff')
                left_color = '#8899aa'
                right_color = 'white'
            
            # Toggle labels
            draw.text(((size[0]-20)//4 + 20, toggle_y+20), "English", fill=left_color, font=small_font, anchor="mm")
            draw.text(((size[0]-20)//4*3 + 20, toggle_y+20), "Español", fill=right_color, font=small_font, anchor="mm")
            
            y_offset += 60
            
        # Submit button
        button_y = size[1] - 80
        draw.rounded_rectangle([20, button_y, size[0]-20, button_y+50], radius=5, fill='#4080ff')
        draw.text((size[0]//2, button_y+25), "Submit", fill='white', font=font, anchor="mm")
    
    # Return the final image
    return image

def main():
    # Create repair form directory if it doesn't exist
    os.makedirs('public/images/repair-form', exist_ok=True)
    
    # Generate mobile form interface images
    interfaces = [
        {
            "filename": "mobile-main.png",
            "title": "Multilingual Support",
            "description": "Toggle between English and Spanish",
            "type": "normal" 
        },
        {
            "filename": "mobile-upload.png",
            "title": "Photo Documentation",
            "description": "Upload photos of vehicle issues",
            "type": "normal"
        },
        {
            "filename": "loading.jpeg",
            "title": "Loading",
            "description": "Please wait while we prepare the form...",
            "type": "loading"
        },
        {
            "filename": "submitted.jpeg",
            "title": "Confirmation",
            "description": "Your repair request has been submitted successfully!",
            "type": "confirmation"
        }
    ]
    
    for interface in interfaces:
        img = create_mobile_interface(
            interface["filename"],
            interface["title"],
            interface["description"],
            interface["type"]
        )
        
        output_path = f'public/images/repair-form/{interface["filename"]}'
        if interface["filename"].endswith('.jpeg') or interface["filename"].endswith('.jpg'):
            img.save(output_path, 'JPEG', quality=90)
        else:
            img.save(output_path, 'PNG')
        
        print(f'Generated {output_path}')

if __name__ == '__main__':
    main()