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
    let overlay = document.querySelector('.popup-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popupBox = document.createElement('div');
    popupBox.className = 'popup-box';

    const largeImageSrc = bird.seen ? `${CONFIG.localImgDir}${bird.code}.jpg` : CONFIG.placeholderImg;
    const targetUrl = bird.url || '#';

    popupBox.innerHTML = `
        <button class="close-btn" aria-label="Close popup">&times;</button>
        <h2>
            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="popup-title-link">
                ${bird.name}
            </a>
        </h2>
        
        <div class="popup-image-container">
            <img src="${largeImageSrc}" alt="${bird.name}" class="${!bird.seen ? 'greyed-out' : ''}">
        </div>

        <div class="popup-scroll-area">
            <table>
                <tr>
                    <td class="info-label">Location Seen:</td>
                    <td class="info-value" style="color: ${bird.seen ? '#111' : '#aaa'};">
                        ${bird.seen ? (bird.where_seen || 'Not recorded') : '-'}
                    </td>
                </tr>
            </table>
        </div>
    `;

    overlay.appendChild(popupBox);
    document.body.appendChild(overlay);

    // Subtle trigger animation delay
    setTimeout(() => overlay.classList.add('active'), 10);

    // Event listener handles clicking outside the box OR clicking the new "X" button
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
