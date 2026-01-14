// Common functions for all pages
// Note: Member system has been removed - no login required

// Theme toggle functionality
(function() {
    // Function to apply theme
    function applyTheme(theme) {
        const body = document.body || document.documentElement;
        if (body) {
            body.classList.remove('dark-mode', 'light-mode');
            body.classList.add(theme);
        }
    }

    // Setup toggle button
    function setupToggleButton() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle && !themeToggle.dataset.themeListener) {
            themeToggle.dataset.themeListener = 'true';
            
            themeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const body = document.body || document.documentElement;
                const isDark = body.classList.contains('dark-mode');
                const newTheme = isDark ? 'light-mode' : 'dark-mode';
                
                applyTheme(newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
    }

    // Initialize theme
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark-mode';
        applyTheme(savedTheme);
        setupToggleButton();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        // DOM already loaded
        initTheme();
    }

    // Also try to set theme immediately if body exists
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    if (document.body) {
        applyTheme(savedTheme);
    }
})();

// Language toggle functionality
(function() {
    // Function to apply language by showing/hiding elements with lang classes
    function applyLanguage(lang) {
        if (!document.documentElement) return;
        
        document.documentElement.lang = lang;
        
        // Update body class for CSS targeting (only if body exists)
        if (document.body) {
            document.body.classList.remove('lang-zh', 'lang-en');
            document.body.classList.add('lang-' + lang);
        }
        
        // Hide all language-specific elements first (exclude language dropdown)
        const zhElements = document.querySelectorAll('.lang-zh:not(.language-option):not(.language-dropdown *), [data-lang="zh"]:not(.language-option)');
        const enElements = document.querySelectorAll('.lang-en:not(.language-option):not(.language-dropdown *), [data-lang="en"]:not(.language-option)');
        
        // Show/hide based on selected language
        if (lang === 'zh') {
            zhElements.forEach(el => {
                // Don't hide language dropdown options
                if (!el.closest('.language-dropdown')) {
                    el.style.display = '';
                }
            });
            enElements.forEach(el => {
                if (!el.closest('.language-dropdown')) {
                    el.style.display = 'none';
                }
            });
        } else {
            zhElements.forEach(el => {
                if (!el.closest('.language-dropdown')) {
                    el.style.display = 'none';
                }
            });
            enElements.forEach(el => {
                if (!el.closest('.language-dropdown')) {
                    el.style.display = '';
                }
            });
        }
        
        // Update dropdown active state (only if DOM is ready)
        if (document.body) {
            updateDropdownActiveState(lang);
            updatePlaceholders(lang);
        }
    }
    
    // Update input placeholders based on language
    function updatePlaceholders(lang) {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="search"]');
        inputs.forEach(input => {
            // Direct placeholder attribute handling
            if (input.hasAttribute('data-placeholder-zh') && input.hasAttribute('data-placeholder-en')) {
                input.placeholder = lang === 'zh' ? input.getAttribute('data-placeholder-zh') : input.getAttribute('data-placeholder-en');
            }
        });
    }

    // Update dropdown active state
    function updateDropdownActiveState(lang) {
        const langOptions = document.querySelectorAll('.language-option');
        langOptions.forEach(option => {
            const optionLang = option.dataset.lang;
            if (optionLang === lang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    // Setup language dropdown
    function setupLanguageDropdown() {
        const langToggle = document.querySelector('.language-toggle');
        if (langToggle && !langToggle.dataset.langListener) {
            langToggle.dataset.langListener = 'true';
            
            const langBtn = langToggle.querySelector('.language-toggle-btn');
            const dropdown = langToggle.querySelector('.language-dropdown');
            
            // Toggle dropdown on button click with animation
            if (langBtn && dropdown) {
                langBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isActive = dropdown.classList.contains('active');
                    if (isActive) {
                        // Close dropdown with animation
                        dropdown.classList.remove('active');
                        // Rotate button icon horizontally (Y-axis)
                        langBtn.style.transform = 'rotateY(0deg)';
                    } else {
                        // Open dropdown with animation
                        dropdown.classList.add('active');
                        // Rotate button icon horizontally (Y-axis)
                        langBtn.style.transform = 'rotateY(180deg)';
                    }
                });
            }
            
            // Handle option clicks
            const langOptions = langToggle.querySelectorAll('.language-option');
            langOptions.forEach(option => {
                option.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const selectedLang = this.dataset.lang;
                    applyLanguage(selectedLang);
                    localStorage.setItem('language', selectedLang);
                    
                    // Close dropdown
                    if (dropdown) {
                        dropdown.classList.remove('active');
                    }
                });
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (langToggle && !langToggle.contains(e.target)) {
                    if (dropdown) {
                        dropdown.classList.remove('active');
                    }
                }
            });
        }
    }

    // Initialize language
    function initLanguage() {
        if (!document.body) {
            // Try again after a short delay if body doesn't exist yet
            setTimeout(initLanguage, 50);
            return;
        }
        
        const savedLang = localStorage.getItem('language') || 'zh';
        
        // Ensure body has language class
        document.body.classList.remove('lang-zh', 'lang-en');
        document.body.classList.add('lang-' + savedLang);
        
        // Apply language
        applyLanguage(savedLang);
        
        // Setup dropdown
        setupLanguageDropdown();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initLanguage, 10);
        });
    } else {
        // DOM already loaded
        setTimeout(initLanguage, 10);
    }

    // Set initial language class on body if it exists
    if (document.body) {
        const savedLang = localStorage.getItem('language') || 'zh';
        document.body.classList.add('lang-' + savedLang);
        if (document.documentElement) {
            document.documentElement.lang = savedLang;
        }
    }
})();

// Common utility functions
(function() {
    // Escape HTML to prevent XSS attacks
    // This function is used across multiple pages
    window.escapeHtml = function(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    };
})();

// Product Detail Modal - Global function
(function() {
    // Create product detail modal HTML if it doesn't exist
    function ensureModalExists() {
        let modal = document.getElementById('productDetailModal');
        if (!modal) {
            // Wait for body to be available
            if (!document.body) {
                return null;
            }
            
            modal = document.createElement('div');
            modal.id = 'productDetailModal';
            modal.className = 'product-detail-modal';
            modal.innerHTML = `
                <div class="product-detail-modal-content">
                    <span class="product-detail-modal-close">&times;</span>
                    <div id="productDetailBody"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close modal events
            const closeBtn = modal.querySelector('.product-detail-modal-close');
            closeBtn.addEventListener('click', closeProductModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeProductModal();
            });
            
            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'flex') {
                    closeProductModal();
                }
            });
        }
        return modal;
    }
    
    // Open product detail modal
    window.openProductDetail = function(product) {
        if (!product) {
            return;
        }
        
        const modal = ensureModalExists();
        if (!modal) {
            // Retry after a short delay
            setTimeout(() => {
                const retryModal = ensureModalExists();
                if (retryModal) {
                    window.openProductDetail(product);
                }
            }, 100);
            return;
        }
        
        const body = document.getElementById('productDetailBody');
        if (!body) {
            return;
        }
        
        // Validate product data - ensure all fields are properly extracted
        const p = {
            id: String(product.id || ''),
            name: String(product.name || ''),
            price: parseFloat(product.price) || 0,
            images: Array.isArray(product.images) ? product.images : (product.img ? [String(product.img)] : []),
            description: String(product.description || '').trim(),
            details: String(product.details || '').trim(),
            category: String(product.category || '').trim(),
            stock: parseInt(product.stock) || 0,
            status: String(product.status || 'active')
        };
        
        
        // Get images and convert Imgur URLs (if needed)
        // Supports both formats: imgur.com/ID and i.imgur.com/ID.png
        let images = p.images.length > 0 ? p.images.map(img => {
            if (!img) return img;
            // If already a direct link (i.imgur.com), return as is
            if (img.includes('i.imgur.com')) {
                return img;
            }
            // Convert imgur.com page URL to direct link
            if (img.startsWith('https://imgur.com/')) {
                const imgurId = img.replace('https://imgur.com/', '').split('/')[0].split('?')[0];
                return `https://i.imgur.com/${imgurId}.png`;
            }
            return img;
        }) : [];
        
        // Build modal content
        let html = `
            <div class="product-detail-container">
                <div class="product-detail-images">
                    <div class="product-detail-main-image">
                        ${images.length > 0 ? (() => {
                            let imgUrl = images[0];
                            // If already a direct link (i.imgur.com), use as is
                            if (imgUrl && !imgUrl.includes('i.imgur.com') && imgUrl.startsWith('https://imgur.com/')) {
                                const imgurId = imgUrl.replace('https://imgur.com/', '').split('/')[0].split('?')[0];
                                imgUrl = `https://i.imgur.com/${imgurId}.png`;
                            }
                            return `<img src="${imgUrl}" alt="${window.escapeHtml(p.name)}" id="productDetailMainImage" style="max-width:100%; height:auto; display:block;" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.onerror=null; if(this.src.includes('.png')){this.src=this.src.replace('.png','.jpg');}else if(this.src.includes('.jpg')&&!this.src.includes('.jpeg')){this.src=this.src.replace('.jpg','.jpeg');}">`;
                        })() : ''}
                    </div>
                    ${images.length > 1 ? `
                        <div class="product-detail-thumbnails">
                            ${images.map((img, idx) => {
                                let imgUrl = img;
                                // If already a direct link (i.imgur.com), use as is
                                if (imgUrl && !imgUrl.includes('i.imgur.com') && imgUrl.startsWith('https://imgur.com/')) {
                                    const imgurId = imgUrl.replace('https://imgur.com/', '').split('/')[0].split('?')[0];
                                    imgUrl = `https://i.imgur.com/${imgurId}.png`;
                                }
                                return `<img src="${imgUrl}" alt="Thumbnail ${idx + 1}" class="product-detail-thumbnail ${idx === 0 ? 'active' : ''}" data-image="${imgUrl}" style="max-width:100%;" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.onerror=null; if(this.src.includes('.png')){this.src=this.src.replace('.png','.jpg');}else if(this.src.includes('.jpg')&&!this.src.includes('.jpeg')){this.src=this.src.replace('.jpg','.jpeg');}">`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="product-detail-info">
                    <h2 class="product-detail-name">${window.escapeHtml(p.name)}</h2>
                    <p class="product-detail-price">$${p.price.toFixed(2)} HKD</p>
                    ${p.description && p.description.trim() ? `<div class="product-detail-section"><h3 class="product-detail-section-title"><span class="lang-zh">簡介</span><span class="lang-en">Description</span></h3><div class="product-detail-description">${window.escapeHtml(p.description).replace(/\n/g, '<br>')}</div></div>` : ''}
                    ${p.details && p.details.trim() ? `<div class="product-detail-section"><h3 class="product-detail-section-title"><span class="lang-zh">詳情</span><span class="lang-en">Details</span></h3><div class="product-detail-details">${window.escapeHtml(p.details).replace(/\n/g, '<br>')}</div></div>` : ''}
                    <button class="product-detail-add-cart" data-id="${p.id}" data-name="${window.escapeHtml(p.name)}" data-price="${p.price}" data-images='${JSON.stringify(images)}'>
                        <span class="lang-zh">加入購物車</span>
                        <span class="lang-en">Add to Cart</span>
                    </button>
                </div>
            </div>
        `;
        
        body.innerHTML = html;
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Ensure all images have referrerPolicy set to avoid 403 errors
        const allImages = body.querySelectorAll('img');
        allImages.forEach(img => {
            if (!img.hasAttribute('referrerpolicy')) {
                img.setAttribute('referrerpolicy', 'no-referrer');
            }
            if (!img.hasAttribute('crossorigin')) {
                img.setAttribute('crossorigin', 'anonymous');
            }
        });
        
        // Thumbnail click events
        if (images.length > 1) {
            const thumbnails = body.querySelectorAll('.product-detail-thumbnail');
            const mainImage = body.querySelector('#productDetailMainImage');
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    let imgSrc = thumb.dataset.image;
                    // Ensure Imgur URL is converted (should already be done, but double-check)
                    if (imgSrc && imgSrc.startsWith('https://imgur.com/') && !imgSrc.includes('i.imgur.com')) {
                        const imgurId = imgSrc.replace('https://imgur.com/', '').split('/')[0].split('?')[0];
                        imgSrc = `https://i.imgur.com/${imgurId}.png`;
                    }
                    if (mainImage && imgSrc) {
                        mainImage.src = imgSrc;
                        // Ensure referrerPolicy is set to avoid 403 errors
                        if (!mainImage.hasAttribute('referrerpolicy')) {
                            mainImage.setAttribute('referrerpolicy', 'no-referrer');
                        }
                        // Fallback to jpg if png fails
                        mainImage.onerror = function() {
                            this.onerror = null;
                            if (this.src.includes('.png')) {
                                this.src = this.src.replace('.png', '.jpg');
                            } else if (this.src.includes('.jpg') && !this.src.includes('.jpeg')) {
                                this.src = this.src.replace('.jpg', '.jpeg');
                            }
                        };
                    }
                    thumbnails.forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
            });
        }
        
        // Add to cart button
        const addCartBtn = body.querySelector('.product-detail-add-cart');
        if (addCartBtn) {
            addCartBtn.addEventListener('click', () => {
                const id = addCartBtn.dataset.id;
                const name = addCartBtn.dataset.name;
                const price = parseFloat(addCartBtn.dataset.price);
                const images = JSON.parse(addCartBtn.dataset.images || '[]');
                
                // Add to cart
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                cart.push({ id, name, price, qty: 1, images });
                localStorage.setItem('cart', JSON.stringify(cart));
                
                // Update cart count
                const cartCountEls = document.querySelectorAll('.cart-count');
                const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
                cartCountEls.forEach(el => el.textContent = totalQty);
                
                // Show success message
                const btnText = addCartBtn.innerHTML;
                addCartBtn.innerHTML = '<span class="lang-zh">✓ 已加入</span><span class="lang-en">✓ Added</span>';
                addCartBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                setTimeout(() => {
                    addCartBtn.innerHTML = btnText;
                    addCartBtn.style.background = '';
                }, 2000);
            });
        }
    };
    
    // Close product detail modal
    function closeProductModal() {
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    window.closeProductDetail = closeProductModal;
})();

