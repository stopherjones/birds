/**
 * Birding Life Life List Engine - Navigation Edition
 * Handles text search, seen status filtering, alphabetical sorting,
 * and swipe/arrow navigation between seen popups.
 */

const CONFIG = {
    dataPath: 'birds.json',
    placeholderImg: 'images/bird-icon.png',
    localImgDir: 'images/birds/'
};
let allBirds = [];
let filteredBirds = [];
let currentNavigationList = []; // Tracks the ordered list for swiping/arrow routing
let currentActiveIndex = -1;

// Touch tracking vectors for mobile swiping
let touchStartX = 0;
let touchEndX = 0;

const DOM = {
    statText: document.getElementById('statText'),
    gallery: document.getElementById('gallery'),
    searchInput: document.getElementById('searchInput'),
    filterSeen: document.getElementById('filterSeen'),
    filterUnseen: document.getElementById('filterUnseen')
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupGlobalInputListeners();
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
        const matchesSearch = !searchQuery || bird.name.toLowerCase().includes(searchQuery);
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

    // Capture the exact presentation list currently sorted on screen
    const displayList = [...filteredBirds].sort((a, b) => a.name.localeCompare(b.name));
    
    // Filter down to only SEEN birds for navigation, ensuring swiping skips empty silhouettes
    currentNavigationList = displayList.filter(bird => bird.seen === true);

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

        item.addEventListener('click', () => {
            if (bird.seen) {
                // Open interactive slide view at this item's relative index position
                const targetIdx = currentNavigationList.findIndex(b => b.code === bird.code);
                createBirdDetailPopup(targetIdx);
            } else {
                // If it's unseen, show the static standalone popup profile
                createStaticUnseenPopup(bird);
            }
        });
        gridContainer.appendChild(item);
    });

    DOM.gallery.appendChild(gridContainer);
}

// Generates the slider popup container for observed sightings
function createBirdDetailPopup(navIndex) {
    if (navIndex < 0 || navIndex >= currentNavigationList.length) return;
    currentActiveIndex = navIndex;
    const bird = currentNavigationList[currentActiveIndex];

    let overlay = document.querySelector('.popup-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popupBox = document.createElement('div');
    popupBox.className = 'popup-box';

    const largeImageSrc = `${CONFIG.localImgDir}${bird.code}.jpg`;
    const targetUrl = bird.url || '#';

popupBox.innerHTML = `
        <h2>${bird.name}</h2>
        
        <div class="popup-image-container" style="text-align: center; margin-bottom: 1rem; background: #ebebeb; border-radius: 4px; overflow: hidden; max-height: 340px; min-height: 200px; display: flex; align-items: center; justify-content: center;">
    <img src="${largeImageSrc}" alt="${bird.name}" onload="this.style.opacity=1" style="width: 100%; height: auto; max-height: 340px; object-fit: cover; display: block; margin: 0 auto; opacity: 0; transition: opacity 0.2s ease; ${!bird.seen ? 'filter: grayscale(1) opacity(0.35); padding: 1.5rem; box-sizing: border-box; max-height: 180px; width: auto; opacity: 1;' : ''}">
</div>


        <div class="popup-scroll-area" style="max-height: 40vh; overflow-y: auto; padding: 0 0.2rem;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; font-size: 0.95rem;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 0.5rem 0; color: #666; font-weight: 500;">Photo taken:</td>
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

    // Append Desktop Arrow overlays ONLY if multiple birds are visible to navigate through
    if (currentNavigationList.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn prev-btn';
        prevBtn.innerHTML = '&#10094;';
        prevBtn.setAttribute('aria-label', 'Previous photo');
        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); changeSlide(-1); });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn next-btn';
        nextBtn.innerHTML = '&#10095;';
        nextBtn.setAttribute('aria-label', 'Next photo');
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); changeSlide(1); });

        overlay.appendChild(prevBtn);
        overlay.appendChild(nextBtn);
    }

    overlay.appendChild(popupBox);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add('active'), 10);

    // Setup Gesture Trackers
    overlay.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    overlay.addEventListener('touchend', e => { 
        touchEndX = e.changedTouches[0].screenX; 
        handleSwipeGesture(); 
    }, { passive: true });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) {
            closeActivePopup();
        }
    });
}

// Fallback logic explicitly for displaying Unseen placeholders (no navigation attached)
function createStaticUnseenPopup(bird) {
    let overlay = document.querySelector('.popup-overlay');
    if (overlay) overlay.remove();
    currentActiveIndex = -1; // Detaches navigation index tracking

    overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const popupBox = document.createElement('div');
    popupBox.className = 'popup-box';

    popupBox.innerHTML = `
        <button class="close-btn" aria-label="Close popup">&times;</button>
        <h2>
            <a href="${bird.url || '#'}" target="_blank" rel="noopener noreferrer" class="popup-title-link">
                ${bird.name}
            </a>
        </h2>
        <div class="popup-image-container">
            <img src="${CONFIG.placeholderImg}" alt="${bird.name}" class="greyed-out">
        </div>
        <div class="popup-scroll-area">
            <table>
                <tr>
                    <td class="info-label">Location Seen:</td>
                    <td class="info-value" style="color: #aaa;">-</td>
                </tr>
            </table>
        </div>
    `;
    overlay.appendChild(popupBox);
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) {
            closeActivePopup();
        }
    });
}

function changeSlide(direction) {
    if (currentActiveIndex === -1 || currentNavigationList.length <= 1) return;
    
    currentActiveIndex += direction;
    if (currentActiveIndex >= currentNavigationList.length) currentActiveIndex = 0;
    if (currentActiveIndex < 0) currentActiveIndex = currentNavigationList.length - 1;

    // Fluidly updates the popup UI content inline without tearing down container
    const bird = currentNavigationList[currentActiveIndex];
    const imgEl = document.querySelector('.popup-image-container img');
    const linkEl = document.querySelector('.popup-title-link');
    const locEl = document.querySelector('.info-value');

    if (imgEl && linkEl && locEl) {
        linkEl.href = bird.url || '#';
        linkEl.textContent = bird.name;
        imgEl.src = `${CONFIG.localImgDir}${bird.code}.jpg`;
        imgEl.alt = bird.name;
        locEl.textContent = bird.where_seen || 'Not recorded';
    }
}

function handleSwipeGesture() {
    if (currentActiveIndex === -1) return;
    const threshold = 50; 
    if (touchEndX < touchStartX - threshold) changeSlide(1);  // Swipe Left -> Next
    if (touchEndX > touchStartX + threshold) changeSlide(-1); // Swipe Right -> Prev
}

function closeActivePopup() {
    const overlay = document.querySelector('.popup-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.remove(); currentActiveIndex = -1; }, 200);
    }
}

function setupGlobalInputListeners() {
    // Listens for structural desktop key actions globally
    document.addEventListener('keydown', (e) => {
        const overlay = document.querySelector('.popup-overlay.active');
        if (!overlay) return;

        if (e.key === 'Escape') closeActivePopup();
        if (currentActiveIndex !== -1) {
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') changeSlide(1);
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') changeSlide(-1);
        }
    });
}

function updateSightingStatistics() {
    if (!DOM.statText) return;
    const totalCount = allBirds.length;
    const seenCount = allBirds.filter(bird => bird.seen === true).length;
    DOM.statText.innerHTML = `${seenCount} species from the ${totalCount} on the <a href="https://www.rspb.org.uk/birds-and-wildlife/a-z" target="_blank" rel="noopener noreferrer">RSPB A-Z list of UK Birds</a>`;
}
