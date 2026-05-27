/**
 * Birding Life List Engine - Basic Edition
 * Handles text search, seen status filtering, and fixed alphabetical sorting.
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
    filterUnseen: document.getElementById('filterUnseen')
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

function setupFilterListeners() {
    if (DOM.searchInput) DOM.searchInput.addEventListener('input', applyFiltersAndRender);
    if (DOM.filterSeen) DOM.filterSeen.addEventListener('change', applyFiltersAndRender);
    if (DOM.filterUnseen) DOM.filterUnseen.addEventListener('change', applyFiltersAndRender);
}

function applyFiltersAndRender() {
    const searchQuery = DOM.searchInput ? DOM.searchInput.value.toLowerCase().trim() : '';
    const showSeen = DOM.filterSeen ? DOM.filterSeen.checked : true;
    const showUnseen = DOM.filterUnseen ? DOM.filterUnseen.checked : true;

    filteredBirds = allBirds.filter(bird => {
        // 1. Text Search Input Parsing (Matches against species name only)
        const matchesSearch = !searchQuery || bird.name.toLowerCase().includes(searchQuery);

        // 2. Sighting Checkbox Filter Status Parsing
        let matchesStatus = false;
        if (bird.seen && showSeen) matchesStatus = true;
        if (!bird.seen && showUnseen) matchesStatus = true;

        return matchesSearch && matchesStatus;
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

    // Default Fixed Behavior: Always Sorted Alphabetically A-Z
    const displayList = [...filteredBirds].sort((a, b) => a.name.localeCompare(b.name));

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
    // Standard workspace canvas garbage cleanups
    let overlay = document.querySelector('.popup-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popupBox = document.createElement('div');
    popupBox.className = 'popup-box';

    const largeImageSrc = bird.seen ? `${CONFIG.localImgDir}${bird.code}.jpg` : CONFIG.placeholderImg;
    
    // Safely match the newly scraped URL property fallback to standard anchor if blank
    const destinationUrl = bird.url || '#';

    popupBox.innerHTML = `
        <h2>
            <a href="${destinationUrl}" target="_blank" rel="noopener noreferrer" class="popup-title-link" title="View details on RSPB Official Site">
                ${bird.name}
            </a>
        </h2>
        
        <div class="popup-image-container" style="text-align: center; margin-bottom: 1rem; background: #ebebeb; border-radius: 4px; overflow: hidden; max-height: 340px;">
            <img src="${largeImageSrc}" alt="${bird.name}" style="width: 100%; height: auto; max-height: 340px; object-fit: cover; display: block; margin: 0 auto; ${!bird.seen ? 'filter: grayscale(1) opacity(0.35); padding: 1.5rem; box-sizing: border-box; max-height: 180px; width: auto;' : ''}">
        </div>

        <div class="popup-scroll-area" style="max-height: 40vh; overflow-y: auto; padding: 0 0.2rem;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; font-size: 0.95rem;">
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
