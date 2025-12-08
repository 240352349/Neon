// Helper function to generate image paths based on product name
function getProductImages(productName) {
    // Map product names to image file names (some have slight differences)
    const imageNameMap = {
        "S/S T-Shirt": "S S T-Shirt",
        "L/S T-Shirt": "L S T-Shirt"
    };
    
    // Use mapped name if exists, otherwise use product name directly
    const imageName = imageNameMap[productName] || productName;
    
    // Images are stored in LE_SSERAFIM folder
    return [
        `LE_SSERAFIM/${imageName}.jpg`
    ];
}

const products = [
    { id: 1, name: "Official Light Stick Keyring", price: 348 },
    { id: 2, name: "FIM'S CLUB Photo Card Holder", price: 348 },
    { id: 3, name: "Hooded Scarf", price: 688 },
    { id: 4, name: "Muffler", price: 688 },
    { id: 5, name: "Official Light Stick Pouch", price: 568 },
    { id: 6, name: "DIY FIM'S CLUB Deco Item", price: 228 },
    { id: 7, name: "FIM'S CLUB Hooded Scarf", price: 328 },
    { id: 8, name: "Pouch Charm Set", price: 348 },
    { id: 9, name: "[LE SSERAFIM x SOFT THUMBNAIL] Delivery Person Keyring", price: 488 },
    { id: 10, name: "[LE SSERAFIM x SOFT THUMBNAIL] Delivery Bag Keyring", price: 328 },
    { id: 11, name: "[LE SSERAFIM x SOFT THUMBNAIL] Delivery Bike Keyring", price: 338 },
    { id: 12, name: "Photo Card Pouch Set (Mini Photo Card Binder)", price: 198 },
    { id: 13, name: "S/S T-Shirt", price: 498 },
    { id: 14, name: "L/S T-Shirt", price: 688 },
    { id: 15, name: "Zip-up Hoodie", price: 888 },
    { id: 16, name: "Packable Backpack", price: 688 },
    { id: 17, name: "Scrunchie", price: 208 },
    { id: 18, name: "Spaghetti Keyring", price: 298 },
    { id: 19, name: "Pin Badge Set", price: 198 },
    { id: 20, name: "Sticker Set A", price: 158 }
];

// Add images to each product
products.forEach(product => {
    product.images = getProductImages(product.name);
});

// Use first 12 products
const displayProducts = products.slice(0, 12);


// Escape HTML to prevent XSS
// escapeHtml function is now in common.js as window.escapeHtml

// Validate product data
function validateProduct(p) {
    if (!p || typeof p !== 'object') return null;
    return {
        id: String(p.id || ''),
        name: String(p.name || ''),
        price: parseFloat(p.price) || 0,
        images: Array.isArray(p.images) ? p.images.filter(img => typeof img === 'string') : (p.img ? [String(p.img)] : [])
    };
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
        
        const images = p.images.length > 0 ? p.images : getProductImages(p.name) || [];
        const firstImage = images[0] || '';
        
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.dataset.productId = p.id;
        
        // Image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'product-image-container';
        
        const productImage = document.createElement('div');
        productImage.className = 'product-image';
        if (firstImage) {
            productImage.style.backgroundImage = `url('${firstImage.replace(/'/g, "\\'")}')`;
        }
        productImage.dataset.images = JSON.stringify(images);
        imageContainer.appendChild(productImage);
        
        // Image indicators
        if (images.length > 1) {
            const indicators = document.createElement('div');
            indicators.className = 'image-indicators';
            images.forEach((_, idx) => {
                const dot = document.createElement('span');
                dot.className = `image-dot ${idx === 0 ? 'active' : ''}`;
                dot.dataset.index = String(idx);
                indicators.appendChild(dot);
            });
            imageContainer.appendChild(indicators);
        }
        
        productDiv.appendChild(imageContainer);
        
        // Product name
        const h4 = document.createElement('h4');
        h4.textContent = p.name;
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
    
    // Add image rotation on hover
    container.querySelectorAll('.product-image').forEach(imgEl => {
        const images = JSON.parse(imgEl.dataset.images || '[]');
        if (images.length > 1) {
            let currentIndex = 0;
            let rotationInterval;
            
            imgEl.closest('.product').addEventListener('mouseenter', () => {
                rotationInterval = setInterval(() => {
                    currentIndex = (currentIndex + 1) % images.length;
                    imgEl.style.backgroundImage = `url('${images[currentIndex]}')`;
                    // Update indicators
                    const dots = imgEl.closest('.product').querySelectorAll('.image-dot');
                    dots.forEach((dot, idx) => {
                        dot.classList.toggle('active', idx === currentIndex);
                    });
                }, 2000); // Change image every 2 seconds
            });
            
            imgEl.closest('.product').addEventListener('mouseleave', () => {
                if (rotationInterval) {
                    clearInterval(rotationInterval);
                }
                currentIndex = 0;
                imgEl.style.backgroundImage = `url('${images[0]}')`;
                const dots = imgEl.closest('.product').querySelectorAll('.image-dot');
                dots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === 0);
                });
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Distribute products to different sections without duplicates
    // NEW ARRIVALS: First 4 products
    // ON SALE: Middle 4 products
    // TOP SELLING: Last 4 products
    renderProducts('newArrivals', displayProducts.slice(0, 4));
    renderProducts('onSale', displayProducts.slice(4, 8));
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
                    img: images[0] || '',
                    selectedColor: images.length > 1 ? 'Color 1' : 'Default',
                    selectedImage: images[0] || '',
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