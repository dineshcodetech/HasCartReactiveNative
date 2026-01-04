#!/usr/bin/env python3
"""
Remove duplicate font file references from Xcode project to fix build errors.
The fonts are already provided by RNVectorIcons CocoaPod, so we need to remove
the duplicate entries from the main project's Copy Bundle Resources phase.
"""
import re
import sys

project_path = "ios/HasCart.xcodeproj/project.pbxproj"

# Read the project file
with open(project_path, 'r') as f:
    content = f.read()

# Font files to remove
fonts = [
    "AntDesign.ttf",
    "Entypo.ttf",
    "EvilIcons.ttf",
    "Feather.ttf",
    "FontAwesome.ttf",
    "FontAwesome5_Brands.ttf",
    "FontAwesome5_Regular.ttf",
    "FontAwesome5_Solid.ttf",
    "FontAwesome6_Brands.ttf",
    "FontAwesome6_Regular.ttf",
    "FontAwesome6_Solid.ttf",
    "Fontisto.ttf",
    "Foundation.ttf",
    "Ionicons.ttf",
    "MaterialCommunityIcons.ttf",
    "MaterialIcons.ttf",
    "Octicons.ttf",
    "SimpleLineIcons.ttf",
    "Zocial.ttf"
]

# Count removals
removals = 0

# Remove PBXBuildFile entries for fonts
for font in fonts:
    # Pattern: line with font file reference and "in Resources"
    pattern = r'^\s+[A-F0-9]+ /\* ' + re.escape(font) + r' in Resources \*/ = \{isa = PBXBuildFile; fileRef = [A-F0-9]+ /\* ' + re.escape(font) + r' \*/; \};\n'
    matches = re.findall(pattern, content, re.MULTILINE)
    removals += len(matches)
    content = re.sub(pattern, '', content, flags=re.MULTILINE)

# Remove PBXFileReference entries for fonts
for font in fonts:
    # Pattern: line with font file reference
    pattern = r'^\s+[A-F0-9]+ /\* ' + re.escape(font) + r' \*/ = \{isa = PBXFileReference; lastKnownFileType = file; name = "?' + re.escape(font) + r'"?; path = [^;]+; sourceTree = [^;]+; \};\n'
    matches = re.findall(pattern, content, re.MULTILINE)
    removals += len(matches)
    content = re.sub(pattern, '', content, flags=re.MULTILINE)

# Remove font file references from PBXResourcesBuildPhase (Copy Bundle Resources)
# This is the key part - removing from the files array in the Resources build phase
for font in fonts:
    # Pattern: reference to font in files array
    pattern = r'^\s+[A-F0-9]+ /\* ' + re.escape(font) + r' in Resources \*/,\n'
    matches = re.findall(pattern, content, re.MULTILINE)
    removals += len(matches)
    content = re.sub(pattern, '', content, flags=re.MULTILINE)

# Write back
with open(project_path, 'w') as f:
    f.write(content)

print(f"✅ Removed {removals} font-related entries from Xcode project")
print(f"✅ Fixed: {project_path}")
print("\n🔄 Now run: cd ios && pod install && cd ..")

