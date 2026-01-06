# 📸 GG Gallery

> A professional, high-performance, and visually stunning photo and video gallery website built with Vanilla JavaScript and Python.

**GG Gallery** is a lightweight, static gallery solution designed to handle thousands of media files with a nested directory structure. It uses a Python script to scan your local folders and generates a static JSON database, allowing for a blazing-fast, serverless experience.

## 📑 Table of Contents
- [✨ Features](#-features)
- [🚀 Demo](#-demo)
- [🛠️ Installation & Setup](#setup)
- [📂 How to Add Media](#-how-to-add-media)
- [🏗️ Architecture & Tech Stack](#architecture)
- [⚙️ Configuration](#configuration)
- [🤝 Contributing](#-contributing)

## <a id="features"></a>✨ Features

### 🎨 User Interface
- **Modern Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile devices.
- **Theme System**: Built-in **Dark** and **Light** modes with persistence (saves your preference).
- **Sticky Footer**: Professional layout ensuring the footer stays at the bottom or pushes down depending on content.
- **Breadcrumb Navigation**: Easy navigation through deep folder structures.

### ⚡ Performance & Logic
- **Single Page Application (SPA)**: Smooth transitions without page reloads.
- **Recursive Directory Parsing**: Supports unlimited depth of sub-folders.
- **Lazy Loading**: Images load efficiently as you scroll.
- **Smart Search**: Real-time recursive search across all folders and files.
- **Scroll Memory**: Intelligently resets scroll position when navigating to new folders.

### 🎥 Media Player
- **Universal Viewer**: Supports both **Images** and **Videos** in a seamless modal overlay.
- **Zoom & Pan**: Interactive zoom controls for detailed image viewing.
- **Slideshow Mode**: Automatic playback with customizable intervals.
- **Fullscreen Support**: Immersive viewing experience.
- **Keyboard Shortcuts**: Navigate using Arrow keys, Esc to close, Space to play/pause.

## <a id="demo"></a>🚀 Demo

*(Add screenshots or a link to a live demo here)*

| Light Mode | Dark Mode |
|:---:|:---:|
| ![Light Mode](https://via.placeholder.com/400x200?text=Light+Mode+Preview) | ![Dark Mode](https://via.placeholder.com/400x200?text=Dark+Mode+Preview) |


## <a id="setup"></a>🛠️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone [https://github.com/yourusername/gg-gallery.git](https://github.com/yourusername/gg-gallery.git)
   cd gg-gallery
   ```

2. **Prerequisites**
   - A modern web browser (Chrome, Firefox, Safari, Edge).
   - **Python 3.x** (Required only for updating the gallery data).

3. **Run Locally**
   - Simply open `index.html` in your browser.
   - *Note: For best results with icons and local file policies, use a simple local server:*
     ```bash
     # Python 3
     python3 -m http.server 8000
     ```
     Then visit `http://localhost:8000`

## <a id="how-to-add-media"></a>📂 How to Add Media

GG Gallery is designed to be easy to update. You don't need to write code to add photos; just organize your folders!

### 1. Organize Your Files

Navigate to the `img/` directory in the project root. Create folders and sub-folders to organize your collection.

**Example Structure:**

```text
img/
├── Vacations/
│   ├── Paris 2023/
│   │   ├── eiffel_tower.jpg
│   │   └── vlog_intro.mp4
│   └── Tokyo 2024/
├── Events/
│   └── Birthday.png
└── random_cat.jpg
```

### 2. Supported Formats

* **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`

* **Videos**: `.mp4`, `.mov`, `.webm`, `.ogg`, `.mkv`

### 3. Generate the Gallery Data

Whenever you add, remove, or rename files, run the generator script:

```bash
# Python 3
python3 generate_gallery.py
```

**What this does:**

* Scans the `img/` folder recursively.

* Handles special characters and spaces in filenames.

* Generates a `gallery_data.js` file which acts as the database for the frontend.

### 4. Refresh

Refresh your browser to see the changes!

## <a id="architecture"></a>🏗️ Architecture and Tech Stack

* **HTML5**: Semantic structure with a focus on accessibility.

* **CSS3**: Custom properties (Variables) for theming, Flexbox & Grid for layout.

* **Vanilla JavaScript (ES6+)**: Zero dependencies for the core logic.

  * State management via a simple reactive store pattern.

  * DOM manipulation for dynamic rendering.

* **Python**: Automation script for file system scanning and JSON generation.

* **Lucide Icons**: Lightweight, beautiful SVG icons.

## <a id="configuration"></a>⚙️ Configuration

You can customize the generator script (`generate_gallery.py`) to change the root directory or allowed extensions:

```python
# generate_gallery.py

# Change the source directory
IMAGE_ROOT = 'my_photos' 

# Add custom extensions
IMG_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.tiff', ...}
```

## <a id="contributing"></a>🤝 Contributing

Contributions are welcome! If you have suggestions or bug fixes:

1. Fork the project.

2. Create a new branch (`git checkout -b feature/AmazingFeature`).

3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).

4. Push to the branch (`git push origin feature/AmazingFeature`).

5. Open a Pull Request.

*Built with ❤️ by Gopal and Gemini Pro.*