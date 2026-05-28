# UK Birding Life List & Photo Gallery
A lightweight, mobile-responsive 'birds seen' log and photo gallery built with vanilla HTML, CSS, and JavaScript. 

Inspired by nostalgic memories of filling in sticker books, the project features a simple list of UK birds (taken from the RSPB A-Z of birds), with placeholder icons intended to be replaced with photos as each bird is seen and photographed.

## 🚀 Features
 * **Dynamic Tracking Statistics:** Real-time counter displaying how many species have been logged from the list.
 * **Interactive Gallery:** Clicking any bird opens a modal showing larger resolution photo, location seen and link to the bird's page on the RSPB website.
 * **Mobile Optimized Layout:** The controls adapt smoothly from desktop rows to single-column phone grids for easy use in the field.
## 📂 Project Architecture
```text
├── index.html          # Main application structure & filter interface
├── style.css           # Custom responsive grid styling and modal rules
├── script.js           # Core filtering, tier-sorting engine, and DOM controller
├── birds.json          # Main database file storing cataloged bird objects
└── images/
    └── birds/          # Full-resolution master images (e.g., blue_tit.jpg)
        └── thumbs/     # Optimized low-weight target thumbnails for the main grid

```

## ⚙️ Automated Photo Workflow & Mobile Workaround
The project utilizes an automated **GitHub Actions** helper workflow to handle high-resolution image compression and generate grid thumbnails into images/birds/thumbs/ dynamically behind the scenes.
Photos should be named as follows:

bird_name.jpg (github action will automatically add a small thumbnail to the gallery)
bird_name__Description of location seen.jpg (github action will automatically update the location in the json and add a small thumbnail to the gallery)