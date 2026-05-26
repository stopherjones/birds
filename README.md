# UK Birding Life List & Photo Gallery
A lightweight, mobile-responsive 'birds seen' log and photo gallery built with vanilla HTML, CSS, and JavaScript. 

Inspired by nostalgic memories of filling in sticker books, the project features a simple list of UK birds (taken from the RSPB A-Z of birds), with placeholder icons intended to be replaced with photos as each bird is seen and photographed.

## 🚀 Features
 * **Dynamic Tracking Statistics:** Real-time counter displaying how many species have been logged from the list.
 * **Searches and Filters:** 
 Toggle checkboxes to view only Seen or Unseen species; sort by rarity or A-Z; filter by bird type (easy to use definitions, rather than precise scientific classification); text search.
 * **Interactive Gallery:** Clicking any bird opens a modal with bird details and larger resolution photo.
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
## 📊 Database Structure (birds.json)
Each bird is structured as a JSON object.
```json
[
  {
    "name": "Blue Tit",
    "code": "blue_tit",
    "type": "songbird",
    "habitat": "woodland",
    "migratory": "resident",
    "rarity": "widespread - over 100,000",
    "seen": true,
    "where_seen": "RSPB Titchwell Marsh",
    "photos": []
  },
  {
    "name": "Osprey",
    "code": "osprey",
    "type": "raptor",
    "habitat": "wetland",
    "migratory": "migrant",
    "rarity": "scarce - less than 1,000",
    "seen": false,
    "where_seen": "",
    "photos": []
  }
]

```
### Rarity Tier Logic Weights
 1. scarce (Highest sorting rank / rarest)
 2. uncommon
 3. common
 4. widespread (Lowest sorting rank / most abundant)
*Note: If two birds share an identical rarity tier, the engine falls back to ordering them alphabetically.*
## ⚙️ Automated Photo Workflow & Mobile Workaround
The project utilizes an automated **GitHub Actions** helper workflow to handle high-resolution image compression and generate grid thumbnails into images/birds/thumbs/ dynamically behind the scenes.