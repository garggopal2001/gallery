import os
import json
import urllib.parse

"""
================================================================================
GG GALLERY - STATIC DATA GENERATOR
================================================================================
Description: recursively scans the 'img' directory to generate a JSON 
             representation of the file system. Handles special characters
             and creates web-safe paths.
Usage:       Run `python generate_gallery.py`
Output:      gallery_data.js
================================================================================
"""

# --- CONFIGURATION ---
IMAGE_ROOT = 'img'
OUTPUT_FILE = 'gallery_data.js'
# Sets for O(1) lookup speed
IMG_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
VID_EXTENSIONS = {'.mp4', '.mov', '.webm', '.ogg', '.mkv'}

def generate_safe_id(path):
    """Generates a DOM-safe ID from a file path."""
    return path.replace(os.sep, "_").replace(" ", "_").replace(".", "").lower()

def scan_directory(path):
    """
    Recursively scans a directory to build the data tree.
    """
    folder_name = os.path.basename(path) or "Home"
    
    # Node Structure
    node = {
        "id": generate_safe_id(path),
        "name": folder_name,
        "type": "folder",
        "children": []
    }

    if not os.path.exists(path):
        print(f"Warning: Path '{path}' not found.")
        return node

    try:
        items = sorted(os.listdir(path))
    except PermissionError:
        print(f"Warning: Permission denied for '{path}'.")
        return node

    for item in items:
        if item.startswith('.'): continue  # Skip hidden files

        item_path = os.path.join(path, item)
        
        if os.path.isdir(item_path):
            # Recurse
            node["children"].append(scan_directory(item_path))
            
        elif os.path.isfile(item_path):
            _, ext = os.path.splitext(item)
            ext = ext.lower()
            
            if ext in IMG_EXTENSIONS or ext in VID_EXTENSIONS:
                # 1. Normalize path separators to forward slashes for Web
                normalized_path = item_path.replace('\\', '/')
                
                # 2. URL Encode the path to safely handle spaces and special chars
                # safe='/' ensures directory separators aren't encoded
                web_path = urllib.parse.quote(normalized_path, safe='/')
                
                node["children"].append({
                    "id": item.replace(".", "_").replace(" ", "_"),
                    "name": item,
                    "type": 'video' if ext in VID_EXTENSIONS else 'image',
                    "src": web_path,
                    "thumbnail": web_path,
                    "date": "" # Placeholder for future metadata expansion
                })

    return node

def generate():
    """Main entry point."""
    print(f"--- GG Gallery Generator ---")
    print(f"Scanning directory: '{IMAGE_ROOT}'...")
    
    if not os.path.exists(IMAGE_ROOT):
        print(f"CRITICAL ERROR: Directory '{IMAGE_ROOT}' does not exist.")
        return

    # Generate Tree
    root_node = scan_directory(IMAGE_ROOT)
    
    # Wrap in root structure
    payload = {
        "id": "root",
        "name": "Home",
        "type": "folder",
        "children": root_node["children"]
    }

    # Write to JS file
    js_content = f"const generatedFileSystem = {json.dumps(payload, indent=4)};"
    
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Success! Data structure saved to '{OUTPUT_FILE}'.")
        print(f"Total items in root: {len(payload['children'])}")
    except IOError as e:
        print(f"Error writing file: {e}")

if __name__ == "__main__":
    generate()