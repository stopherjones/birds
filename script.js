/**
 * Birding Life List Engine
 * Dynamically handles multi-tier filter rules and self-populates dropdown properties.
 */

const CONFIG = {
    dataPath: 'birds.json',
    placeholderImg: 'images/bird-icon.png',
    localImgDir: 'images/birds/'
};
let allBirds = [];
let filteredBirds = [];

const DOM = {
    statText: document.getElementById('statText'),
    gallery: document.getElementById('gallery'),
    searchInput: document.getElementById('searchInput'),
    filterSeen: document.getElementById('filterSeen'),
    filterUnseen: document.getElementById('filterUnseen'),
    typeFilter: document.getElementById('typeFilter'),
    sortOrder: document.getElementById('sortOrder') // Added sort reference mapping
};

// Strict rarity hierarchy sorting scale (Rarest down to Most Common)
const RARITY_ORDER = {
    'scarce': 1,
    'uncommon': 2,
    'common': 3,
    'widespread': 4
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    fetch(CONFIG.dataPath)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allBirds = data;
            
            filteredBirds = [...allBirds];
            
            populateTypeDropdown();
            setupFilterListeners();
            applyFiltersAndRender();
        })
        .catch(error => {
            console.error('Failed to parse catalog records:', error);
            if (DOM.gallery) {
                DOM.gallery.innerHTML = `<div class="empty-state" style="color: #c62828; border-color: #c62828;">
                    Failed to initialize bird species database: ${error.message}
                </div>`;
            }
        });
}

/**
 * Automatically inspects the JSON database and populates the Type select box
 */
function populateTypeDropdown() {
    if (!DOM.typeFilter) return;
    // Extract unique types and clear falsy values
    const types = [...new Set(allBirds.map(bird => bird.type).filter(Boolean))];
    types.sort((a, b) => a.localeCompare(b));

    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.toLowerCase();
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        DOM.typeFilter.appendChild(option);
    });
}

function setupFilterListeners() {
    if (DOM.searchInput) DOM.searchInput.addEventListener('input', applyFiltersAndRender);
    if (DOM.filterSeen) DOM.filterSeen.addEventListener('change', applyFiltersAndRender);
    if (DOM.filterUnseen) DOM.filterUnseen.addEventListener('change', applyFiltersAndRender);
    if (DOM.typeFilter) DOM.typeFilter.addEventListener('change', applyFiltersAndRender);
    if (DOM.sortOrder) DOM.sortOrder.addEventListener('change', applyFiltersAndRender); // Added sorting change listener
}

function applyFiltersAndRender() {
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.toLowerCase().trim() : '';
    const showSeen = DOM.filterSeen ? DOM.filterSeen.checked : true;
    const showUnseen = DOM.filterUnseen ? DOM.filterUnseen.checked : true;
    const selectedType = DOM.typeFilter ? DOM.typeFilter.value : 'all';

    filteredBirds = allBirds.filter(bird => {
        // 1. Text Search Box Parsing
        const matchesSearch = !searchQuery || 
            bird.name.toLowerCase().includes(searchQuery) || 
            (bird.type && bird.type.toLowerCase().includes(searchQuery));

        // 2. Status Checkbox Parsing
        let matchesStatus = false;
        if (bird.seen && showSeen) matchesStatus = true;
        if (!bird.seen && showUnseen) matchesStatus = true;

        // 3. Dynamic Bird Type Selection Menu Parsing
        const matchesType = selectedType === 'all' || 
            (bird.type && bird.type.toLowerCase() === selectedType);

        return matchesSearch && matchesStatus && matchesType;
    });

    renderGalleryGrid();
    updateSightingStatistics();
}

function renderGalleryGrid() {
    if (!DOM.gallery) return;
    DOM.gallery.innerHTML = '';

    if (filteredBirds.length === 0) {
        DOM.gallery.innerHTML = `<div class="empty-state">No species observed matching these filters.</div>`;
        return;
    }

    // Fail-safe real-time check for the sorting layout control selection
    const sortSelect = document.getElementById('sortOrder');
    const currentSort = sortSelect ? sortSelect.value : 'az';

    // Multi-tier Sorting Logic Engine
    const displayList = [...filteredBirds].sort((a, b) => {
        if (currentSort === 'rarity') {
            // .split(' ')[0] extracts just the first word from "scarce - less than 1,000"
            const firstWordA = a.rarity?.toLowerCase().trim().split(' ')[0];
            const firstWordB = b.rarity?.toLowerCase().trim().split(' ')[0];

            const weightA = RARITY_ORDER[firstWordA] || 99;
            const weightB = RARITY_ORDER[firstWordB] || 99;
            
            if (weightA !== weightB) {
                return weightA - weightB; // Rarest weights (1, 2) rise to the top
            }
        }
        // Fallback default or secondary sorting rule: Alphabetical A-Z
        return a.name.localeCompare(b.name);
    });

    // Build the structural fluid grid layout wrapper seamlessly
    const gridContainer = document.createElement('div');
    gridContainer.className = 'gallery-grid';

    displayList.forEach(bird => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.cursor = 'pointer';

        const wrapper = document.createElement('div');
        wrapper.className = 'flag-wrapper';

        const img = document.createElement('img');
        img.className = 'gallery-image';
        img.setAttribute('loading', 'lazy');

        if (bird.seen) {
            // Pointing to the optimized thumbnails folder generated by GitHub Actions
            img.src = `${CONFIG.localImgDir}thumbs/${bird.code}.jpg`;
            img.alt = bird.name;
        } else {
            img.src = CONFIG.placeholderImg;
            img.alt = `${bird.name} (Unseen Silhouette)`;
            img.classList.add('greyed-out');
        }
        wrapper.appendChild(img);

        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.textContent = bird.name;

        item.appendChild(wrapper);
        item.appendChild(caption);

        item.addEventListener('click', () => createBirdDetailPopup(bird));
        gridContainer.appendChild(item);
    });

    DOM.gallery.appendChild(gridContainer);
}

function createBirdDetailPopup(bird) {
    let overlay = document.querySelector('.popup-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popupBox = document.createElement('div');
    popupBox.className = 'popup-box';

    const largeImageSrc = bird.seen ? `${CONFIG.localImgDir}${bird.code}.jpg` : CONFIG.placeholderImg;

    popupBox.innerHTML = `
        <h2>${bird.name}</h2>
        
        <div class="popup-image-container" style="text-align: center; margin-bottom: 1rem; background: #ebebeb; border-radius: 4px; overflow: hidden; max-height: 340px;">
            <img src="${largeImageSrc}" alt="${bird.name}" style="width: 100%; height: auto; max-height: 340px; object-fit: cover; display: block; margin: 0 auto; ${!bird.seen ? 'filter: grayscale(1) opacity(0.35); padding: 1.5rem; box-sizing: border-box; max-height: 180px; width: auto;' : ''}">
        </div>

        <div class="popup-scroll-area" style="max-height: 40vh; overflow-y: auto; padding: 0 0.2rem;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; font-size: 0.95rem;">
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 0.5rem 0; color: #666; font-weight: 500;">Species Group:</td><td style="padding: 0.5rem 0; font-weight: 600; text-transform: capitalize;">${bird.type || 'N/A'}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 0.5rem 0; color: #666; font-weight: 500;">Environment:</td><td style="padding: 0.5rem 0; font-weight: 600; text-transform: capitalize;">${bird.habitat || 'N/A'}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 0.5rem 0; color: #666; font-weight: 500;">Migration Status:</td><td style="padding: 0.5rem 0; font-weight: 600; text-transform: capitalize;">${bird.migratory || 'N/A'}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 0.5rem 0; color: #666; font-weight: 500;">Rarity Index:</td><td style="padding: 0.5rem 0; font-weight: 600; text-transform: capitalize;">${bird.rarity || 'N/A'}</td></tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 0.5rem 0; color: #666; font-weight: 500;">Location Seen:</td>
                    <td style="padding: 0.5rem 0; font-weight: 600; color: ${bird.seen ? '#111' : '#aaa'};">
                        ${bird.seen ? (bird.where_seen || 'Not recorded') : '-'}
                    </td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; margin-top: 1rem;">
            <button class="close-btn" style="width: 100%; box-sizing: border-box; cursor: pointer; border: none; padding: 0.6rem 1rem;">Close</button>
        </div>
    `;

    overlay.appendChild(popupBox);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add('active'), 10);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        }
    });
}

function updateSightingStatistics() {
    if (!DOM.statText) return;
    const totalCount = allBirds.length;
    const seenCount = allBirds.filter(bird => bird.seen === true).length;
    DOM.statText.textContent = `${seenCount} species seen out of ${totalCount} total tracked species`;
}
