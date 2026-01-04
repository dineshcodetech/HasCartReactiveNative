#!/usr/bin/env python3
"""
Add main.jsbundle to the HasCart group in Xcode project
"""
import re

project_path = "ios/HasCart.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# Find the file reference ID for main.jsbundle
match = re.search(r'([A-F0-9]+) /\* main\.jsbundle \*/ = \{isa = PBXFileReference', content)
if not match:
    print("❌ main.jsbundle file reference not found!")
    exit(1)

file_ref_id = match.group(1)
print(f"Found main.jsbundle file reference: {file_ref_id}")

# Check if it's already in the HasCart group (by looking for the pattern)
# The HasCart group contains main.m, so we'll add our file there
if f'{file_ref_id} /* main.jsbundle */,' in content:
    # Check if it's in a children array
    pattern = rf'children = \(\n(?:.*?\n)*?\s*{file_ref_id} /\* main\.jsbundle \*/,'
    if re.search(pattern, content):
        print("✅ main.jsbundle is already in a group!")
    else:
        # Need to add to HasCart group - find it by main.m reference
        # Add main.jsbundle right after main.m in the children array
        content = re.sub(
            r'(13B07FB71A68108700A75B9A /\* main\.m \*/,)',
            r'\1\n\t\t\t\t' + file_ref_id + r' /* main.jsbundle */,',
            content
        )
        with open(project_path, 'w') as f:
            f.write(content)
        print("✅ Added main.jsbundle to HasCart group!")
else:
    # Add to HasCart group - find it by main.m reference
    content = re.sub(
        r'(13B07FB71A68108700A75B9A /\* main\.m \*/,)',
        r'\1\n\t\t\t\t' + file_ref_id + r' /* main.jsbundle */,',
        content
    )
    with open(project_path, 'w') as f:
        f.write(content)
    print("✅ Added main.jsbundle to HasCart group!")

print("✅ Ready to build!")

