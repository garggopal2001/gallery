/**
 * =============================================================================
 * GG GALLERY - CORE APPLICATION CONTROLLER
 * =============================================================================
 * Handles Routing, UI Rendering, State Management, and Media Playback.
 * =============================================================================
 */

// --- UTILITIES ---

const EMPTY_ROOT = { id: 'root', name: 'Home', type: 'folder', children: [] };

/** * Debounce: Limits rate of function execution (e.g., search input).
 */
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// --- APPLICATION STATE & CONTROLLER ---

const app = {
    state: {
        pathStack: [],       // Breadcrumb history
        activeFolder: null,  // Current folder data
        theme: localStorage.getItem('gg_theme') || 'dark'
    },

    /**
     * Bootstraps the application.
     */
    init() {
        try {
            const data = (typeof generatedFileSystem !== 'undefined') ? generatedFileSystem : EMPTY_ROOT;
            if (data === EMPTY_ROOT) console.warn("GG Gallery: Data file missing. Loaded empty state.");

            this.applyTheme();
            this.navigateTo([data]); // Initial Route
            this.initializeSearch(data);
            this.renderSidebar(data);
            this.initializeKeyboardNavigation();
            
            if (typeof lucide !== 'undefined') lucide.createIcons();

        } catch (err) {
            console.error("Initialization failed:", err);
        }
    },

    // --- NAVIGATION LOGIC ---

    /**
     * Renders a specific path in the application.
     * @param {Array} pathArray - Array of folder nodes.
     */
    navigateTo(pathArray) {
        if (!pathArray?.length) return;

        this.state.pathStack = pathArray;
        this.state.activeFolder = pathArray[pathArray.length - 1];

        // Update UI
        this.renderBreadcrumbs();
        this.renderGrid(this.state.activeFolder);
        this.highlightSidebarItem();

        // SCROLL FIX: Reset scroll position to top
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.scrollTop = 0;
    },

    openFolder(folderId) {
        const target = this.state.activeFolder?.children?.find(c => c.id === folderId);
        if (target) this.navigateTo([...this.state.pathStack, target]);
    },

    navigateUp(index) {
        if (index >= 0 && index < this.state.pathStack.length) {
            this.navigateTo(this.state.pathStack.slice(0, index + 1));
        }
    },

    navigateHome() {
        if (this.state.pathStack.length) this.navigateTo([this.state.pathStack[0]]);
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const isDesktop = window.innerWidth >= 1024;
        sidebar?.classList.toggle(isDesktop ? 'collapsed' : 'active');
    },

    // --- THEMING ---

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('gg_theme', this.state.theme);
        this.applyTheme();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.setAttribute('data-lucide', this.state.theme === 'dark' ? 'sun' : 'moon');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    // --- SEARCH SYSTEM ---

    initializeSearch(rootData) {
        const input = document.getElementById('searchInput');
        if (!input) return;

        input.addEventListener('input', debounce((e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (!query) {
                this.renderGrid(this.state.activeFolder);
            } else {
                const matches = this.recursiveSearch(rootData, query);
                this.renderSearchResults(matches, query);
            }
        }, 300));
    },

    recursiveSearch(node, query) {
        let matches = [];
        if (!node.children) return matches;

        for (const child of node.children) {
            if (child.name.toLowerCase().includes(query)) matches.push(child);
            if (child.type === 'folder') {
                matches = matches.concat(this.recursiveSearch(child, query));
            }
        }
        return matches;
    },

    // --- DATA HELPERS ---

    findFolderThumbnail(folder) {
        if (!folder.children) return null;
        
        // Priority 1: Immediate child image
        const img = folder.children.find(c => c.type === 'image');
        if (img) return img.thumbnail;

        // Priority 2: Deep search
        for (const child of folder.children) {
            if (child.type === 'folder') {
                const found = this.findFolderThumbnail(child);
                if (found) return found;
            }
        }
        return null;
    },

    // --- RENDERING: SIDEBAR ---

    renderSidebar(rootData) {
        const container = document.getElementById('navTree');
        if (!container) return;

        container.innerHTML = this.buildSidebarHTML(rootData, 0);
        
        // Event Delegation
        container.onclick = (e) => {
            // Handle Expansion Arrow
            const toggle = e.target.closest('.nav-toggle-btn');
            if (toggle) {
                e.stopPropagation();
                const item = toggle.closest('.nav-tree-item');
                const isExpanded = item.classList.toggle('expanded');
                const icon = toggle.querySelector('svg') || toggle.querySelector('i');
                if (icon) icon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
                return;
            }

            // Handle Navigation Click
            const row = e.target.closest('.nav-item-row');
            if (row) {
                const id = row.dataset.id;
                this.handleSidebarNavigation(id);
            }
        };
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    buildSidebarHTML(folder, depth) {
        const subfolders = folder.children?.filter(c => c.type === 'folder') || [];
        const hasSubs = subfolders.length > 0;
        const padding = 0.5 + (depth * 1);
        
        const childrenHTML = hasSubs 
            ? `<div class="nav-children">${subfolders.map(s => this.buildSidebarHTML(s, depth + 1)).join('')}</div>`
            : '';

        const arrowStyle = hasSubs ? '' : 'opacity:0; pointer-events:none;';
        const iconName = depth === 0 ? 'home' : 'folder';

        return `
            <div class="nav-tree-item" id="tree-item-${folder.id}">
                <div class="nav-item-row" data-id="${folder.id}" style="padding-left: ${padding}rem" tabindex="0">
                    <div class="nav-toggle-btn" role="button">
                        <i data-lucide="chevron-right" style="width:16px; ${arrowStyle}"></i>
                    </div>
                    <i data-lucide="${iconName}" class="nav-folder-icon"></i>
                    <span class="nav-item-text">${folder.name}</span>
                </div>
                ${childrenHTML}
            </div>`;
    },

    handleSidebarNavigation(targetId) {
        if (window.innerWidth < 1024) document.getElementById('sidebar').classList.remove('active');

        // DFS to find path
        const findPath = (node, id, stack) => {
            if (node.id === id) return [...stack, node];
            if (node.children) {
                for (const child of node.children) {
                    if (child.type === 'folder') {
                        const path = findPath(child, id, [...stack, node]);
                        if (path) return path;
                    }
                }
            }
            return null;
        };

        const path = findPath(this.state.pathStack[0], targetId, []);
        if (path) {
            this.navigateTo(path);
            this.expandSidebarToItem(targetId);
        }
    },

    // --- RENDERING: GRID ---

    renderBreadcrumbs() {
        const container = document.getElementById('breadcrumbs');
        if (!container) return;

        container.innerHTML = this.state.pathStack.map((f, i) => {
            const isLast = i === this.state.pathStack.length - 1;
            return isLast 
                ? `<div class="breadcrumb-item active">${f.name}</div>`
                : `<div class="breadcrumb-item" onclick="app.navigateUp(${i})" role="button">${f.name}<i data-lucide="chevron-right" style="width:14px;"></i></div>`;
        }).join('');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderGrid(folderData) {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        document.getElementById('pageTitle').textContent = folderData?.name || 'Error';
        grid.innerHTML = '';

        if (!folderData?.children?.length) {
            grid.innerHTML = `<div class="empty-state">Folder is empty</div>`;
            document.getElementById('pageMeta').textContent = '0 items';
            return;
        }

        // Sort: Folders first
        const items = [...folderData.children].sort((a, b) => 
            (a.type === 'folder' === b.type === 'folder') ? 0 : a.type === 'folder' ? -1 : 1
        );

        const counts = { 
            folders: items.filter(c => c.type === 'folder').length, 
            files: items.filter(c => c.type !== 'folder').length 
        };
        document.getElementById('pageMeta').textContent = `${counts.folders} Folders • ${counts.files} Files`;

        items.forEach((item, i) => this.createCard(item, i, grid, items));
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderSearchResults(results, term) {
        const grid = document.getElementById('galleryGrid');
        document.getElementById('pageTitle').textContent = `Search: "${term}"`;
        document.getElementById('pageMeta').textContent = `${results.length} found`;
        grid.innerHTML = results.length ? '' : `<div class="empty-state">No results found</div>`;

        results.forEach((item, i) => this.createCard(item, i, grid, results, true));
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    createCard(item, index, container, contextList, isSearch = false) {
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.style.animationDelay = `${index * 30}ms`;
        card.tabIndex = 0;

        const wrapper = document.createElement('div');
        wrapper.className = 'card-media-wrapper';

        if (item.type === 'folder') {
            // --- FOLDER RENDER ---
            const thumb = this.findFolderThumbnail(item);
            const count = {
                img: item.children?.filter(c => c.type === 'image').length || 0,
                vid: item.children?.filter(c => c.type === 'video').length || 0
            };

            wrapper.innerHTML = thumb 
                ? `<img src="${thumb}" class="card-img-bg" onerror="this.style.display='none'">
                   <img src="${thumb}" class="card-img-main" alt="${item.name}" onerror="this.style.display='none'">`
                : `<div class="card-placeholder"><i data-lucide="folder" class="placeholder-icon"></i></div>`;

            wrapper.innerHTML += `
                <div class="folder-overlay">
                    <div class="folder-name">${item.name}</div>
                    <div class="folder-count">${count.img} Photos • ${count.vid} Videos</div>
                </div>`;
            
            card.onclick = () => isSearch ? this.handleSidebarNavigation(item.id) : this.openFolder(item.id);

        } else {
            // --- MEDIA RENDER ---
            const playlist = contextList.filter(i => i.type !== 'folder');
            card.onclick = () => mediaPlayer.open(playlist, item);

            if (item.type === 'video') {
                const vid = document.createElement('video');
                vid.className = 'card-video-main';
                vid.src = `${item.src}#t=0.1`; // Seek to frame 1
                vid.muted = true;
                vid.preload = 'metadata';
                vid.onmouseenter = () => vid.play().catch(() => {});
                vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0.1; };
                
                wrapper.appendChild(vid);
                wrapper.innerHTML += `<div class="video-indicator"><i data-lucide="play"></i></div>`;
            } else {
                const img = document.createElement('img');
                img.className = 'card-img-main';
                img.loading = 'lazy';
                img.src = item.thumbnail;
                img.onerror = () => {
                    wrapper.innerHTML = `<div class="card-placeholder"><i data-lucide="image-off"></i><small>Error</small></div>`;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                };
                
                // Background blur effect
                const bg = img.cloneNode();
                bg.className = 'card-img-bg';
                
                wrapper.appendChild(bg);
                wrapper.appendChild(img);
            }
        }

        card.onkeydown = (e) => { if (e.key === 'Enter') card.click(); };
        card.appendChild(wrapper);
        container.appendChild(card);
    },

    // --- KEYBOARD NAVIGATION (SIDEBAR) ---

    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (mediaPlayer.isActive || !this.state.activeFolder) return;
            
            const activeId = this.state.activeFolder.id;
            const currentEl = document.querySelector(`.nav-item-row[data-id="${activeId}"]`);
            if (!currentEl) return;

            const rows = Array.from(document.querySelectorAll('.nav-item-row:not([style*="display: none"])'));
            const idx = rows.indexOf(currentEl);

            if (e.key === 'ArrowDown' && idx < rows.length - 1) {
                e.preventDefault();
                this.handleSidebarNavigation(rows[idx + 1].dataset.id);
            } else if (e.key === 'ArrowUp' && idx > 0) {
                e.preventDefault();
                this.handleSidebarNavigation(rows[idx - 1].dataset.id);
            }
        });
    },
    
    expandSidebarToItem(id) {
        const el = document.querySelector(`.nav-item-row[data-id="${id}"]`);
        if (el) {
            let parent = el.closest('.nav-children');
            while (parent) {
                parent.parentElement.classList.add('expanded');
                const icon = parent.parentElement.querySelector('.nav-toggle-btn svg');
                if (icon) icon.style.transform = 'rotate(90deg)';
                parent = parent.parentElement.parentElement.closest('.nav-children');
            }
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    },

    highlightSidebarItem() {
        if (!this.state.activeFolder) return;
        document.querySelectorAll('.nav-item-row').forEach(el => {
            el.classList.remove('active');
            el.setAttribute('aria-selected', 'false');
        });
        const active = document.querySelector(`.nav-item-row[data-id="${this.state.activeFolder.id}"]`);
        if (active) {
            active.classList.add('active');
            active.setAttribute('aria-selected', 'true');
            this.expandSidebarToItem(this.state.activeFolder.id);
        }
    }
};

// --- MEDIA VIEWER CONTROLLER ---

const mediaPlayer = {
    isActive: false,
    playlist: [],
    idx: 0,
    zoomLevel: 1,
    slideshowId: null,

    open(list, item) {
        if (!list?.length) return;
        this.playlist = list;
        this.idx = list.findIndex(i => i.id === item.id);
        this.isActive = true;
        
        const viewer = document.getElementById('mediaViewer');
        viewer.classList.add('active');
        viewer.focus();
        
        this.render();
        this.bindKeys();
    },

    close() {
        this.stopSlideshow();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        
        this.isActive = false;
        document.getElementById('mediaViewer').classList.remove('active');
        document.getElementById('viewerContent').innerHTML = '<div class="loader" id="viewerLoader"></div>';
        this.zoomLevel = 1;
        document.onkeydown = null; // Unbind keys
        app.initializeKeyboardNavigation(); // Rebind app keys
    },

    render() {
        const item = this.playlist[this.idx];
        document.getElementById('viewerTitle').textContent = item.name;
        document.getElementById('viewerCounter').textContent = `${this.idx + 1} / ${this.playlist.length}`;
        
        const wrapper = document.getElementById('viewerContent');
        const loader = document.getElementById('viewerLoader');
        loader.style.display = 'block';

        // Clear existing content (except loader)
        Array.from(wrapper.children).forEach(c => { if(c !== loader) c.remove(); });
        this.zoomLevel = 1;

        if (item.type === 'video') {
            const vid = document.createElement('video');
            vid.className = 'media-video';
            vid.src = item.src;
            vid.controls = true;
            vid.autoplay = true;
            vid.oncanplay = () => loader.style.display = 'none';
            wrapper.appendChild(vid);
        } else {
            const img = new Image();
            img.src = item.src;
            img.className = 'media-item';
            img.onload = () => loader.style.display = 'none';
            img.onerror = () => {
                loader.style.display = 'none';
                wrapper.innerHTML += `<div class="error-msg">Image Failed</div>`;
            };
            
            const zoomWrap = document.createElement('div');
            zoomWrap.className = 'zoom-container';
            zoomWrap.appendChild(img);
            wrapper.appendChild(zoomWrap);
        }
    },

    next() {
        if (!this.playlist.length) return;
        this.idx = (this.idx + 1) % this.playlist.length;
        this.render();
    },

    prev() {
        if (!this.playlist.length) return;
        this.idx = (this.idx - 1 + this.playlist.length) % this.playlist.length;
        this.render();
    },

    zoom(dir) {
        const img = document.querySelector('.zoom-container');
        if (!img) return;
        this.zoomLevel += (dir === 'in' ? 0.2 : -0.2);
        this.zoomLevel = Math.max(0.5, this.zoomLevel);
        img.style.transform = `scale(${this.zoomLevel})`;
    },

    toggleSlideshow() {
        if (this.slideshowId) this.stopSlideshow();
        else {
            this.slideshowId = setInterval(() => this.next(), 3000);
            document.getElementById('btnSlideshow').classList.add('active-state');
        }
    },

    stopSlideshow() {
        clearInterval(this.slideshowId);
        this.slideshowId = null;
        document.getElementById('btnSlideshow')?.classList.remove('active-state');
    },

    toggleFullscreen() {
        const v = document.getElementById('mediaViewer');
        document.fullscreenElement ? document.exitFullscreen() : v.requestFullscreen();
    },

    bindKeys() {
        document.onkeydown = (e) => {
            if (!this.isActive) return;
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'Escape') this.close();
            if (e.key === ' ') { 
                e.preventDefault(); 
                const vid = document.querySelector('video');
                if(vid) vid.paused ? vid.play() : vid.pause();
            }
        };
    }
};

window.addEventListener('DOMContentLoaded', () => app.init());