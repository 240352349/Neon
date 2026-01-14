// Google Sheets Configuration
const PRODUCTS_SHEET_ID = '1kVIjlHkZ2Aulh-YGnfPTavE-kysUifbnHNCdcCPeM_Y';
let products = [];
let displayProducts = [];

// Load products from Google Sheets (make it global)
async function loadProductsFromGoogleSheets(forceRefresh = false) {
    try {
        // Check if force refresh is requested via URL parameter or function parameter
        const urlParams = new URLSearchParams(window.location.search);
        const forceRefreshParam = urlParams.get('refresh') === 'true';
        forceRefresh = forceRefresh || forceRefreshParam;
        
        // Try to get from cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = localStorage.getItem('productsData');
            const cacheTime = localStorage.getItem('productsDataTime');
            const now = Date.now();
            
            // Use cache if less than 1 hour old (reduced from 24 hours for faster updates)
            if (cached && cacheTime && (now - parseInt(cacheTime)) < 3600000) {
                const cachedData = JSON.parse(cached);
                products = cachedData.products || [];
                displayProducts = cachedData.displayProducts || [];
                return { products, displayProducts };
            }
        }
        
        // Fetch from Google Sheets
        // Use /edit instead of /gviz/tq for better compatibility
        const url = `https://docs.google.com/spreadsheets/d/${PRODUCTS_SHEET_ID}/gviz/tq?tqx=out:json&tq=SELECT%20*`;
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            // If 403, try alternative method
            if (response.status === 403) {
                console.warn('Google Sheets access denied. Please ensure the sheet is set to "Anyone with the link can view"');
                // Try to use cached data if available
                const cached = localStorage.getItem('productsData');
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    products = cachedData.products || [];
                    displayProducts = cachedData.displayProducts || [];
                    return { products, displayProducts };
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Parse Google Sheets JSON response
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error('無法解析 Google Sheets 數據格式');
        }
        
        const jsonText = text.substring(jsonStart, jsonEnd);
        const json = JSON.parse(jsonText);
        const rows = json.table.rows;
        
        products = [];
        rows.forEach((row, index) => {
            if (index === 0) return; // Skip header row
            
            const cells = row.c;
            if (!cells || cells.length < 3) return; // Skip empty rows
            
            // Parse columns: A=ID, B=Name, C=Price, D=Image1, E=Image2, F=Image3, G=Description, H=Details, I=Size, J=Stock, K=Status
            const id = cells[0] && cells[0].v ? String(cells[0].v).trim() : '';
            const name = cells[1] && cells[1].v ? String(cells[1].v).trim() : '';
            const price = cells[2] && cells[2].v ? parseFloat(cells[2].v) : 0;
            
            // Debug: Log row data for FIM'S CLUB Hooded Scarf
            if (name && (name.includes('FIM') || name.includes('Hooded') || name.includes('Scarf'))) {
                console.log('Found product row:', {
                    index: index,
                    id: id,
                    name: name,
                    cells: cells.map((c, i) => ({
                        index: i,
                        column: String.fromCharCode(65 + i),
                        v: c ? c.v : null,
                        f: c ? c.f : null
                    }))
                });
            }
            const image1 = cells[3] && cells[3].v ? String(cells[3].v).trim() : '';
            let image2 = cells[4] && cells[4].v ? String(cells[4].v).trim() : '';
            const image3 = cells[5] && cells[5].v ? String(cells[5].v).trim() : '';
            
            // Parse Description and Details - check both .v and .f properties
            // Try to get value from cells[6] (column G) for Description
            let description = '';
            if (cells[6]) {
                const descValue = cells[6].v !== null && cells[6].v !== undefined ? cells[6].v : 
                                 (cells[6].f !== null && cells[6].f !== undefined ? cells[6].f : null);
                if (descValue !== null && descValue !== undefined) {
                    description = String(descValue).trim();
                }
            }
            
            // Try to get value from cells[7] (column H) for Details
            let details = '';
            if (cells[7]) {
                const detailsValue = cells[7].v !== null && cells[7].v !== undefined ? cells[7].v : 
                                    (cells[7].f !== null && cells[7].f !== undefined ? cells[7].f : null);
                if (detailsValue !== null && detailsValue !== undefined) {
                    details = String(detailsValue).trim();
                }
            }
            
            const size = (cells[8] && (cells[8].v || cells[8].f)) ? String(cells[8].v || cells[8].f).trim() : '';
            const stock = (cells[9] && cells[9].v) ? parseInt(cells[9].v) : 0;
            
            
            // Status might be in column K (index 10) or column E (index 4) if Image2 is missing
            let status = '';
            if (cells[10] && (cells[10].v || cells[10].f)) {
                const statusValue = String(cells[10].v || cells[10].f).trim();
                if (statusValue.toLowerCase() === 'active' || statusValue.toLowerCase() === 'inactive') {
                    status = statusValue;
                }
            }
            // Check if Image2 column actually contains Status (when Image2 is missing)
            if (!status && image2 && image2.toLowerCase() === 'active') {
                status = 'active';
                image2 = ''; // Clear image2 since it's actually Status
            }
            // Default to active if no status found (backward compatibility)
            if (!status) {
                status = 'active';
            }
            
            // Only add products with required fields and Active status
            if (id && name && price > 0 && status.toLowerCase() === 'active') {
                // Build images array (support both imgur.com/ID and i.imgur.com/ID.png formats)
                const images = [];
                if (image1) images.push(image1);
                if (image2 && image2.toLowerCase() !== 'active') images.push(image2); // Only add if not Status
                if (image3) images.push(image3);
                
                const product = {
                    id: id,
                    name: name,
                    price: price,
                    images: images,
                    description: description,
                    details: details,
                    size: size,
                    stock: stock,
                    status: status
                };
                
                // Debug: Log if FIM'S CLUB Hooded Scarf is being added
                if (name && (name.includes('FIM') || name.includes('Hooded') || name.includes('Scarf'))) {
                    console.log('Adding product to array:', product);
                }
                
                products.push(product);
            } else if (name && (name.includes('FIM') || name.includes('Hooded') || name.includes('Scarf'))) {
                // Debug: Log why product was not added
                console.log('Product NOT added - reasons:', {
                    id: id,
                    name: name,
                    price: price,
                    status: status,
                    hasId: !!id,
                    hasName: !!name,
                    hasPrice: price > 0,
                    isActive: status.toLowerCase() === 'active'
                });
            }
        });
        
        // Sort by ID to maintain order (handle both numeric and alphanumeric IDs like LS00001)
        products.sort((a, b) => {
            // Extract numeric part from ID (e.g., "LS00001" → 1, "1" → 1)
            const aNum = parseInt(a.id.replace(/\D/g, '')) || 0;
            const bNum = parseInt(b.id.replace(/\D/g, '')) || 0;
            if (aNum !== bNum) {
                return aNum - bNum;
            }
            // If numeric parts are equal, sort by string
            return a.id.localeCompare(b.id);
        });
        
        // Use first 12 products for display
        displayProducts = products.slice(0, 12);
        
        // Cache the data
        localStorage.setItem('productsData', JSON.stringify({ products, displayProducts }));
        localStorage.setItem('productsDataTime', now.toString());
        
        return { products, displayProducts };
        
    } catch (error) {
        // Fallback: try to use cached data even if old
        // Fallback: try to use cached data even if old
        const cached = localStorage.getItem('productsData');
        if (cached) {
            try {
                const cachedData = JSON.parse(cached);
                products = cachedData.products || [];
                displayProducts = cachedData.displayProducts || [];
                return { products, displayProducts };
            } catch (parseError) {
                // Cache is corrupted, return empty
                products = [];
                displayProducts = [];
                return { products, displayProducts };
            }
        } else {
            products = [];
            displayProducts = [];
            return { products, displayProducts };
        }
    }
}

// Helper function to generate image paths (fallback for old products)
function getProductImages(productName) {
    const imageNameMap = {
        "S/S T-Shirt": "S S T-Shirt",
        "L/S T-Shirt": "L S T-Shirt"
    };
    const imageName = imageNameMap[productName] || productName;
    return [`LE_SSERAFIM/${imageName}.jpg`];
}


// Escape HTML to prevent XSS
// escapeHtml function is now in common.js as window.escapeHtml

// Validate product data
function validateProduct(p) {
    if (!p || typeof p !== 'object') return null;
    const validated = {
        id: String(p.id || ''),
        name: String(p.name || ''),
        price: parseFloat(p.price) || 0,
        images: Array.isArray(p.images) ? p.images.filter(img => typeof img === 'string') : (p.img ? [String(p.img)] : []),
        description: String(p.description || '').trim(),
        details: String(p.details || '').trim(),
        size: String(p.size || '').trim(),
        stock: parseInt(p.stock) || 0,
        status: String(p.status || 'active')
    };
    return validated;
}

function renderProducts(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with id "${containerId}" not found`);
        return;
    }
    
    container.innerHTML = '';
    
    data.forEach(rawProduct => {
        const p = validateProduct(rawProduct);
        if (!p || !p.id) return; // Skip invalid products
        
        const images = p.images.length > 0 ? p.images : [];
        const firstImage = images[0] || '';
        
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.dataset.productId = p.id;
        
        // Image container (clickable)
        const imageContainer = document.createElement('div');
        imageContainer.className = 'product-image-container';
        imageContainer.style.cursor = 'pointer';
        imageContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.openProductDetail === 'function') {
                // Pass full product data including description and details - use rawProduct if available
                const productToPass = rawProduct && rawProduct.description !== undefined ? rawProduct : p;
                window.openProductDetail(productToPass);
            }
        });
        
        const productImage = document.createElement('div');
        productImage.className = 'product-image';
        if (firstImage) {
            // Use image URL directly - already in correct format (https://i.imgur.com/ID.png)
            let imageUrl = firstImage.trim();
            // Only convert if it's imgur.com page URL (not i.imgur.com)
            if (imageUrl.startsWith('https://imgur.com/') && !imageUrl.includes('i.imgur.com')) {
                const imgurId = imageUrl.replace('https://imgur.com/', '').split('/')[0].split('?')[0];
                imageUrl = `https://i.imgur.com/${imgurId}.png`;
            } else if (!imageUrl.startsWith('http')) {
                // Local path - escape single quotes
                imageUrl = imageUrl.replace(/'/g, "\\'");
            }
            // Use img tag instead of backgroundImage to avoid CORS/403 issues
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';
            img.crossOrigin = 'anonymous'; // Avoid 403 errors
            img.referrerPolicy = 'no-referrer'; // Avoid 403 errors
            img.onerror = function() {
                // Fallback: try with backgroundImage if img fails
                this.style.display = 'none';
                productImage.style.backgroundImage = `url('${imageUrl.replace(/'/g, "\\'")}')`;
                productImage.style.backgroundSize = 'cover';
            };
            productImage.appendChild(img);
        }
        productImage.dataset.images = JSON.stringify(images);
        imageContainer.appendChild(productImage);
        
        productDiv.appendChild(imageContainer);
        
        // Product name (clickable)
        const h4 = document.createElement('h4');
        h4.textContent = p.name;
        h4.style.cursor = 'pointer';
        h4.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.openProductDetail === 'function') {
                // Pass full product data including description and details - use rawProduct if available
                const productToPass = rawProduct && rawProduct.description !== undefined ? rawProduct : p;
                window.openProductDetail(productToPass);
            }
        });
        productDiv.appendChild(h4);
        
        // Price
        const priceP = document.createElement('p');
        priceP.textContent = `$${p.price.toFixed(2)}`;
        productDiv.appendChild(priceP);
        
        // Add to cart button
        const addBtn = document.createElement('button');
        addBtn.className = 'add-to-cart';
        addBtn.dataset.id = p.id;
        addBtn.dataset.name = p.name;
        addBtn.dataset.price = String(p.price);
        addBtn.dataset.images = JSON.stringify(images);
        addBtn.textContent = 'Add to Cart';
        productDiv.appendChild(addBtn);
        
        container.appendChild(productDiv);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load products from Google Sheets
    await loadProductsFromGoogleSheets();
    
    // Distribute products to different sections without duplicates
    // NEW ARRIVALS: Middle 4 products (swapped with ON SALE)
    // ON SALE: First 4 products (swapped with NEW ARRIVALS)
    // TOP SELLING: Last 4 products
    renderProducts('newArrivals', displayProducts.slice(4, 8));
    renderProducts('onSale', displayProducts.slice(0, 4));
    renderProducts('topSelling', displayProducts.slice(8, 12));

    // Shopping cart
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    updateCartCount();
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const images = JSON.parse(btn.dataset.images || '[]');
            const item = cart.find(i => i.id === id);
            if (item) {
                item.qty++;
            } else {
                cart.push({
                    id, 
                    name: btn.dataset.name, 
                    price: +btn.dataset.price, 
                    images: images,
                    qty: 1
                });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        });
    });
    function updateCartCount() {
        const count = cart.reduce((sum, i) => sum + i.qty, 0);
        document.querySelector('.cart-count').textContent = count;
    }

    // Reviews Carousel with Auto-play
    let current = 0;
    const reviews = document.querySelectorAll('.review');
    let autoPlayInterval;
    const reviewsCarousel = document.querySelector('.reviews-carousel');
    let isTransitioning = false; // Flag to prevent rapid clicks
    
    function showReview(index) {
        // Prevent rapid clicks during transition
        if (isTransitioning) return;
        if (!reviews || reviews.length === 0) return;
        if (index === current) return;
        
        isTransitioning = true;
        
        const nextIndex = index % reviews.length;
        if (nextIndex < 0) return;
        
        // Remove active from current review
        if (reviews[current]) {
            reviews[current].classList.remove('active');
        }
        
        // Update current index
        current = nextIndex;
        
        // Add active to new review immediately for smooth transition
        if (reviews[current]) {
            reviews[current].classList.add('active');
        }
        
        // Reset transition flag after a short delay
        setTimeout(() => {
            isTransitioning = false;
        }, 300);
    }
    
    function nextReview() {
        if (reviews.length === 0) return;
        showReview((current + 1) % reviews.length);
    }
    
    function prevReview() {
        if (reviews.length === 0) return;
        showReview((current - 1 + reviews.length) % reviews.length);
    }
    
    function startAutoPlay() {
        stopAutoPlay(); // Clear any existing interval first
        if (reviews.length > 0) {
            autoPlayInterval = setInterval(nextReview, 4000); // Auto switch every 4 seconds
        }
    }
    
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
    
    // Manual button controls
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (isTransitioning) return;
            stopAutoPlay();
            nextReview();
            startAutoPlay(); // Restart auto-play
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (isTransitioning) return;
            stopAutoPlay();
            prevReview();
            startAutoPlay(); // Restart auto-play
        });
    }
    
    // Pause auto-play on mouse hover
    if (reviewsCarousel) {
        reviewsCarousel.addEventListener('mouseenter', stopAutoPlay);
        reviewsCarousel.addEventListener('mouseleave', startAutoPlay);
    }
    
    // Start auto-play
    if (reviews.length > 0) {
        startAutoPlay();
    }

    // Theme toggle is handled by common.js

    const closeBanner = document.querySelector('.close-banner');
    if (closeBanner) {
        closeBanner.addEventListener('click', () => {
            const topBanner = document.getElementById('topBanner');
            if (topBanner) {
                topBanner.style.display = 'none';
            }
        });
    }

    // Newsletter Subscribe
    window.handleSubscribe = function() {
        const emailInput = document.getElementById('newsletterEmail');
        const email = emailInput?.value.trim();
        
        if (!email) {
            alert('Please enter your email address');
            return;
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        alert('Subscribe successfully!');
        emailInput.value = '';
    };
});