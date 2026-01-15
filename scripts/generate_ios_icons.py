#!/usr/bin/env python3
import os
import subprocess
import json

# Configuration
SOURCE_IMAGE = "assets/icon.png"  # Using icon.png as source
DEST_DIR = "ios/HasCart/Images.xcassets/AppIcon.appiconset"

# Ensure source exists
if not os.path.exists(SOURCE_IMAGE):
    # Try alternate
    SOURCE_IMAGE = "assets/logo.png"
    if not os.path.exists(SOURCE_IMAGE):
        print("❌ Error: Could not find Source Icon (assets/icon.png or assets/logo.png)")
        exit(1)

print(f"ℹ️  Using source image: {SOURCE_IMAGE}")

# Define required sizes (Size, Scale, FilenameSuffix)
# Using standard iOS App Icon sizes
# Validation error specifically asked for 120x120 (which is 60x60 @2x)
ICONS = [
    # iPhone Notification (20pt)
    {"size": 20, "scale": 2, "filename": "Icon-Apps-20x20@2x.png"},
    {"size": 20, "scale": 3, "filename": "Icon-Apps-20x20@3x.png"},
    # iPhone Settings (29pt)
    {"size": 29, "scale": 2, "filename": "Icon-Apps-29x29@2x.png"},
    {"size": 29, "scale": 3, "filename": "Icon-Apps-29x29@3x.png"},
    # iPhone Spotlight (40pt)
    {"size": 40, "scale": 2, "filename": "Icon-Apps-40x40@2x.png"},
    {"size": 40, "scale": 3, "filename": "Icon-Apps-40x40@3x.png"},
    # iPhone App (60pt) -> This produces 120x120 and 180x180
    {"size": 60, "scale": 2, "filename": "Icon-Apps-60x60@2x.png"}, # 120x120
    {"size": 60, "scale": 3, "filename": "Icon-Apps-60x60@3x.png"}, # 180x180
    # iPad Notifications (20pt)
    {"size": 20, "scale": 1, "filename": "Icon-Apps-20x20@1x.png"},
    # iPad Settings (29pt)
    {"size": 29, "scale": 1, "filename": "Icon-Apps-29x29@1x.png"},
    # iPad Spotlight (40pt)
    {"size": 40, "scale": 1, "filename": "Icon-Apps-40x40@1x.png"},
    # iPad App (76pt)
    {"size": 76, "scale": 1, "filename": "Icon-Apps-76x76@1x.png"},
    {"size": 76, "scale": 2, "filename": "Icon-Apps-76x76@2x.png"},
    # iPad Pro App (83.5pt)
    {"size": 83.5, "scale": 2, "filename": "Icon-Apps-83.5x83.5@2x.png"},
    # App Store (1024pt)
    {"size": 1024, "scale": 1, "filename": "Icon-AppStore-1024x1024.png"}
]

# Generate Images using sips
for icon in ICONS:
    final_size = int(icon["size"] * icon["scale"])
    filename = icon["filename"]
    dest_path = os.path.join(DEST_DIR, filename)
    
    cmd = ["sips", "-z", str(final_size), str(final_size), SOURCE_IMAGE, "--out", dest_path]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
    print(f"✅ Generated {filename} ({final_size}x{final_size})")

# Generate Contents.json
contents = {
    "images": [],
    "info": {
        "author": "xcode",
        "version": 1
    }
}

for icon in ICONS:
    item = {
        "size": f"{icon['size']}x{icon['size']}",
        "idiom": "iphone", 
        "filename": icon["filename"],
        "scale": f"{int(icon['scale'])}x"
    }
    
    # Adjust idiom based on size logic or just set 'universal' or specific
    # Simpler approach: Map specific icons to idioms
    if icon["size"] == 1024:
        item["idiom"] = "ios-marketing"
    elif icon["size"] == 76 or icon["size"] == 83.5 or (icon["size"] == 20 and icon["scale"] == 1) or (icon["size"] == 29 and icon["scale"] == 1):
        item["idiom"] = "ipad"
    else:
        # For common sizes, it's safer to list them for both or universal if possible, 
        # but Xcode strict validation prefers distinct entries.
        # Let's start with 'iphone' for the core set requested by the error.
        item["idiom"] = "iphone"

    # Add duplicate entries for iPad if they share sizes (like 29@2x) to ensure coverage
    # (Skipping complex logic for this script, focusing on fixing the 120x120 error)
    
    contents["images"].append(item)

# Overwrite Contents.json with correct references
with open(os.path.join(DEST_DIR, "Contents.json"), "w") as f:
    json.dump(contents, f, indent=2)

print("✅ Updated Contents.json")
