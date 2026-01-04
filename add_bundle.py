#!/usr/bin/env python3
"""
Add main.jsbundle to Xcode project for Release builds
"""
import re
import uuid

project_path = "ios/HasCart.xcodeproj/project.pbxproj"

with open(project_path, 'r') as f:
    content = f.read()

# Check if main.jsbundle is already referenced
if 'main.jsbundle' in content:
    print("✅ main.jsbundle is already in the Xcode project!")
else:
    # Generate unique IDs for the file reference and build file
    file_ref_id = uuid.uuid4().hex[:24].upper()
    build_file_id = uuid.uuid4().hex[:24].upper()
    
    # Find the PBXFileReference section and add main.jsbundle
    file_ref_entry = f'\t\t{file_ref_id} /* main.jsbundle */ = {{isa = PBXFileReference; lastKnownFileType = text; path = main.jsbundle; sourceTree = "<group>"; }};\n'
    
    # Find the line before "/* End PBXFileReference section */"
    content = re.sub(
        r'(/\* End PBXFileReference section \*/)',
        file_ref_entry + r'\1',
        content
    )
    
    # Add to PBXBuildFile section
    build_file_entry = f'\t\t{build_file_id} /* main.jsbundle in Resources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* main.jsbundle */; }};\n'
    
    content = re.sub(
        r'(/\* End PBXBuildFile section \*/)',
        build_file_entry + r'\1',
        content
    )
    
    # Find the Resources build phase and add the build file reference
    # Look for PBXResourcesBuildPhase files array
    def add_to_resources(match):
        files_content = match.group(1)
        new_file = f'\t\t\t\t{build_file_id} /* main.jsbundle in Resources */,\n'
        return files_content + new_file
    
    content = re.sub(
        r'(files = \(\n(?:\t+[A-F0-9]+ /\* .* in Resources \*/,\n)*)',
        add_to_resources,
        content,
        count=1  # Only add to first (main) Resources phase
    )
    
    with open(project_path, 'w') as f:
        f.write(content)
    
    print("✅ Added main.jsbundle to Xcode project!")

print("✅ Ready for Release build on your iPhone!")

