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

    // Determine the current sorted list to allow swiping through items
    const displayList = [...filteredBirds].sort((a, b) => a.name.localeCompare(b.name));
    const currentIndex = displayList.findIndex(b => b.code === bird.code);

    overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popupBox = document.createElement('div');
    popupBox.className = 'popup-box';

    const largeImageSrc = bird.seen ? `${CONFIG.localImgDir}${bird.code}.jpg` : CONFIG.placeholderImg;

    // Injecting a CSS keyframe rule dynamically if it doesn't exist yet for the spinner animation
    if (!document.getElementById('spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes popup-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Main layout config including absolute header alignment and loading indicator elements
    popupBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #111;">${bird.name}</h2>
            <span class="close-btn" style="cursor: pointer; font-size: 2rem; font-weight: 300; color: #666; line-height: 1; user-select: none;">&times;</span>
        </div>
        
        <div class="popup-image-container" style="position: relative; text-align: center; margin-bottom: 1rem; background: #ebebeb; border-radius: 4px; overflow: hidden; max-height: 340px; min-height: 240px; display: flex; align-items: center; justify-content: center;">
            
            ${bird.seen ? `
            <div class="image-spinner" style="position: absolute; width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-left-color: #333; border-radius: 50%; animation: popup-spin 0.8s linear infinite;"></div>
            ` : ''}

            <img src="${largeImageSrc}" alt="${bird.name}" 
                 onload="this.style.opacity=1; let sp = this.previousElementSibling; if(sp && sp.classList.contains('image-spinner')) sp.remove();" 
                 style="width: 100%; height: auto; max-height: 340px; object-fit: cover; display: block; margin: 0 auto; opacity: 0; transition: opacity 0.25s ease; z-index: 2; ${!bird.seen ? 'filter: grayscale(1) opacity(0.35); padding: 1.5rem; box-sizing: border-box; max-height: 180px; width: auto; opacity: 1;' : ''}">
        </div>

        <div class="popup-scroll-area" style="max-height: 40vh; overflow-y: auto; padding: 0 0.2rem;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; font-size: 0.95rem;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 0.5rem 0; color: #666; font-weight: 500;">Photo taken:</td>
                    <td style="padding: 0.5rem 0; font-weight: 600; color: ${bird.seen ? '#111' : '#aaa'}; text-align: right;">
                        ${bird.seen ? (bird.where_seen || 'Not recorded') : '-'}
                    </td>
                </tr>
            </table>
        </div>
    `;

    overlay.appendChild(popupBox);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add('active'), 10);

    // Standard Close Window Logic
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        }
    });

    // Swiping Logic implementation
    let touchStartX = 0;
    let touchEndX = 0;

    popupBox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    popupBox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
        const swipeThreshold = 50; // Minimum distance in pixels to count as a swipe
        if (touchStartX - touchEndX > swipeThreshold) {
            // Swiped Left -> Load Next Bird
            if (currentIndex < displayList.length - 1) {
                createBirdDetailPopup(displayList[currentIndex + 1]);
            }
        } else if (touchEndX - touchStartX > swipeThreshold) {
            // Swiped Right -> Load Previous Bird
            if (currentIndex > 0) {
                createBirdDetailPopup(displayList[currentIndex - 1]);
            }
        }
    }
}

function updateSightingStatistics() {
    if (!DOM.statText) return;
    const totalCount = allBirds.length;
    const seenCount = allBirds.filter(bird => bird.seen === true).length;
    DOM.statText.textContent = `${seenCount} species seen out of ${totalCount} total tracked species`;
}
