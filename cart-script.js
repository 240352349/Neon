document.addEventListener('DOMContentLoaded', async () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItemsDiv = document.getElementById('cartItems');
    const emptyMsg = document.getElementById('emptyMsg');
    const subtotalEl = document.getElementById('subtotal');
    const deliveryEl = document.getElementById('delivery');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartCountEls = document.querySelectorAll('.cart-count');

    // escapeHtml function is now in common.js as window.escapeHtml
    
    // Load products from Google Sheets to get full product data (description, details, etc.)
    let products = [];
    if (typeof loadProductsFromGoogleSheets === 'function') {
        try {
            await loadProductsFromGoogleSheets();
            // Get products from global scope
            if (typeof window.products !== 'undefined' && window.products.length > 0) {
                products = window.products;
            } else {
                // Try to get from localStorage cache
                const cached = localStorage.getItem('productsData');
                if (cached) {
                    try {
                        const cachedData = JSON.parse(cached);
                        products = cachedData.products || [];
                    } catch (e) {
                        // Cache is corrupted, continue without products
                    }
                }
            }
        } catch (error) {
            // If loading fails, try to get from localStorage cache
            const cached = localStorage.getItem('productsData');
            if (cached) {
                try {
                    const cachedData = JSON.parse(cached);
                    products = cachedData.products || [];
                } catch (e) {
                    // Cache is corrupted, continue without products
                }
            }
        }
    }

    // Validate and sanitize cart item data
    function validateCartItem(item, index) {
        if (!item || typeof item !== 'object') return null;
        return {
            id: String(item.id || ''),
            name: String(item.name || ''),
            price: parseFloat(item.price) || 0,
            qty: Math.max(1, parseInt(item.qty) || 1),
            images: Array.isArray(item.images) ? item.images.filter(img => typeof img === 'string') : (item.img ? [String(item.img)] : []),
            size: String(item.size || ''),
            index: index
        };
    }

    function renderCart() {
        if (cart.length === 0) {
            // Show empty message for current language
            const currentLang = localStorage.getItem('language') || 'zh';
            const emptyMsg = document.getElementById('emptyMsg');
            const emptyMsgEn = document.getElementById('emptyMsgEn');
            if (currentLang === 'zh' && emptyMsg) {
                emptyMsg.style.display = 'block';
            } else if (currentLang === 'en' && emptyMsgEn) {
                emptyMsgEn.style.display = 'block';
            }
            cartItemsDiv.innerHTML = '';
            updateSummary(0);
            return;
        }
        // Hide empty message for both languages
        const emptyMsg = document.getElementById('emptyMsg');
        const emptyMsgEn = document.getElementById('emptyMsgEn');
        if (emptyMsg) emptyMsg.style.display = 'none';
        if (emptyMsgEn) emptyMsgEn.style.display = 'none';

        // Clear and rebuild cart items safely
        cartItemsDiv.innerHTML = '';
        
        cart.forEach((rawItem, index) => {
            const item = validateCartItem(rawItem, index);
            if (!item || !item.id) return; // Skip invalid items
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.dataset.id = item.id;
            cartItem.dataset.index = String(index);
            
            // Image container (clickable)
            const imageDiv = document.createElement('div');
            imageDiv.className = 'cart-item-image';
            imageDiv.style.cursor = 'pointer';
            if (item.images[0]) {
                // Use image URL directly - already in correct format (https://i.imgur.com/ID.png)
                let imageUrl = item.images[0].trim();
                // Only convert if it's imgur.com page URL (not i.imgur.com)
                if (imageUrl.startsWith('https://imgur.com/') && !imageUrl.includes('i.imgur.com')) {
                    const imgurId = imageUrl.replace('https://imgur.com/', '').split('/')[0].split('?')[0];
                    imageUrl = `https://i.imgur.com/${imgurId}.png`;
                } else if (!imageUrl.startsWith('http')) {
                    // Local path - escape single quotes
                    imageUrl = (window.escapeHtml ? window.escapeHtml(imageUrl) : imageUrl).replace(/'/g, "\\'");
                }
                // Escape single quotes in URL for CSS
                const safeUrl = imageUrl.replace(/'/g, "\\'");
                imageDiv.style.backgroundImage = `url('${safeUrl}')`;
                imageDiv.style.backgroundSize = 'cover';
                imageDiv.style.backgroundPosition = 'center';
            }
            imageDiv.addEventListener('click', () => {
                if (typeof window.openProductDetail === 'function') {
                    // Try to get full product data from products array if available
                    let productToPass = rawItem;
                    if (typeof products !== 'undefined' && products.length > 0) {
                        const fullProduct = products.find(p => p.id === item.id);
                        if (fullProduct && fullProduct.description !== undefined) {
                            productToPass = fullProduct;
                        }
                    }
                    // If rawItem doesn't have description/details, use rawItem as is
                    if (!productToPass.description && !productToPass.details) {
                        productToPass = {
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            images: item.images,
                            description: rawItem.description || '',
                            details: rawItem.details || '',
                            size: rawItem.size || ''
                        };
                    }
                    window.openProductDetail(productToPass);
                }
            });
            cartItem.appendChild(imageDiv);
            
            // Details container
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'cart-item-details';
            
            const h4 = document.createElement('h4');
            h4.textContent = item.name;
            h4.style.cursor = 'pointer';
            h4.addEventListener('click', () => {
                if (typeof window.openProductDetail === 'function') {
                    // Try to get full product data from products array if available
                    let productToPass = rawItem;
                    if (typeof products !== 'undefined' && products.length > 0) {
                        const fullProduct = products.find(p => p.id === item.id);
                        if (fullProduct && fullProduct.description !== undefined) {
                            productToPass = fullProduct;
                        }
                    }
                    // If rawItem doesn't have description/details, use rawItem as is
                    if (!productToPass.description && !productToPass.details) {
                        productToPass = {
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            images: item.images,
                            description: rawItem.description || '',
                            details: rawItem.details || '',
                            size: rawItem.size || ''
                        };
                    }
                    window.openProductDetail(productToPass);
                }
            });
            detailsDiv.appendChild(h4);
            
            const priceP = document.createElement('p');
            priceP.textContent = `$${item.price.toFixed(2)}`;
            detailsDiv.appendChild(priceP);
            
            // Display size if available with edit button
            if (item.size && item.size.trim()) {
                const sizeContainer = document.createElement('div');
                sizeContainer.className = 'cart-item-size-container';
                
                // Get product size options from products array
                let productSizeOptions = '';
                if (typeof products !== 'undefined' && products.length > 0) {
                    const fullProduct = products.find(p => p.id === item.id);
                    if (fullProduct && fullProduct.size && fullProduct.size.trim()) {
                        productSizeOptions = fullProduct.size;
                    }
                }
                // Fallback to rawItem size if product not found
                if (!productSizeOptions && rawItem.size && rawItem.size.trim()) {
                    productSizeOptions = rawItem.size;
                }
                
                // Size display (non-editing mode)
                const sizeDisplay = document.createElement('div');
                sizeDisplay.className = 'cart-item-size-display';
                sizeDisplay.innerHTML = `
                    <span class="lang-zh">尺寸: </span>
                    <span class="lang-en">Size: </span>
                    <strong>${window.escapeHtml ? window.escapeHtml(item.size) : item.size}</strong>
                    <button class="cart-size-edit-btn" title="Edit size">
                        <span class="lang-zh">編輯</span>
                        <span class="lang-en">Edit</span>
                    </button>
                `;
                
                // Size selector (editing mode) - hidden by default
                const sizeSelector = document.createElement('div');
                sizeSelector.className = 'cart-item-size-selector';
                sizeSelector.style.display = 'none';
                
                if (productSizeOptions) {
                    const sizeOptions = productSizeOptions.split(',').map(s => s.trim()).filter(s => s);
                    sizeSelector.innerHTML = `
                        <div class="cart-size-selector-options">
                            ${sizeOptions.map(sizeOption => `
                                <button class="cart-size-option ${sizeOption === item.size ? 'selected' : ''}" data-size="${window.escapeHtml ? window.escapeHtml(sizeOption) : sizeOption}">
                                    ${window.escapeHtml ? window.escapeHtml(sizeOption) : sizeOption}
                                </button>
                            `).join('')}
                        </div>
                        <div class="cart-size-selector-actions">
                            <button class="cart-size-save-btn">
                                <span class="lang-zh">確認</span>
                                <span class="lang-en">Confirm</span>
                            </button>
                            <button class="cart-size-cancel-btn">
                                <span class="lang-zh">取消</span>
                                <span class="lang-en">Cancel</span>
                            </button>
                        </div>
                    `;
                }
                
                sizeContainer.appendChild(sizeDisplay);
                sizeContainer.appendChild(sizeSelector);
                detailsDiv.appendChild(sizeContainer);
                
                // Edit button click handler
                const editBtn = sizeDisplay.querySelector('.cart-size-edit-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        sizeDisplay.style.display = 'none';
                        sizeSelector.style.display = 'block';
                    });
                }
                
                // Size option click handler
                const sizeOptionBtns = sizeSelector.querySelectorAll('.cart-size-option');
                let selectedSizeValue = item.size;
                sizeOptionBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        sizeOptionBtns.forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        selectedSizeValue = btn.dataset.size;
                    });
                });
                
                // Save button click handler
                const saveBtn = sizeSelector.querySelector('.cart-size-save-btn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Update cart item size
                        if (cart[index] && cart[index].id === item.id) {
                            cart[index].size = selectedSizeValue;
                            localStorage.setItem('cart', JSON.stringify(cart));
                            // Re-render cart to show updated size
                            renderCart();
                        }
                    });
                }
                
                // Cancel button click handler
                const cancelBtn = sizeSelector.querySelector('.cart-size-cancel-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        sizeDisplay.style.display = 'block';
                        sizeSelector.style.display = 'none';
                        // Reset selection to current size
                        sizeOptionBtns.forEach(btn => {
                            btn.classList.remove('selected');
                            if (btn.dataset.size === item.size) {
                                btn.classList.add('selected');
                            }
                        });
                        selectedSizeValue = item.size;
                    });
                }
            }
            
            // Quantity controls
            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'cart-item-quantity';
            
            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'decrease';
            decreaseBtn.textContent = '-';
            quantityDiv.appendChild(decreaseBtn);
            
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.value = item.qty;
            qtyInput.min = '1';
            quantityDiv.appendChild(qtyInput);
            
            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'increase';
            increaseBtn.textContent = '+';
            quantityDiv.appendChild(increaseBtn);
            
            detailsDiv.appendChild(quantityDiv);
            
            // Remove link
            const removeLink = document.createElement('a');
            removeLink.href = '#';
            removeLink.className = 'cart-item-remove';
            removeLink.textContent = 'Remove';
            detailsDiv.appendChild(removeLink);
            
            cartItem.appendChild(detailsDiv);
            
            // Total price
            const totalDiv = document.createElement('div');
            totalDiv.textContent = `$${(item.price * item.qty).toFixed(2)}`;
            cartItem.appendChild(totalDiv);
            
            cartItemsDiv.appendChild(cartItem);
        });

        updateSummary();
        addEventListeners();
    }

    function updateSummary() {
        const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        const delivery = 0; // 包運費，運費為 0
        const total = subtotal; // 總額等於小計（包運費）
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        deliveryEl.textContent = `$${delivery.toFixed(2)}`;
        totalEl.textContent = `$${total.toFixed(2)}`;
        cartCountEls.forEach(el => el.textContent = cart.reduce((s,i)=>s+i.qty,0));
        localStorage.setItem('checkoutTotal', total.toFixed(2));
    }

    function addEventListeners() {
        cartItemsDiv.querySelectorAll('.decrease').forEach(btn => {
            btn.onclick = () => updateQty(btn.closest('.cart-item'), -1);
        });
        cartItemsDiv.querySelectorAll('.increase').forEach(btn => {
            btn.onclick = () => updateQty(btn.closest('.cart-item'), 1);
        });
        cartItemsDiv.querySelectorAll('input[type="number"]').forEach(input => {
            input.onchange = (e) => {
                let qty = parseInt(e.target.value);
                if (qty < 1) qty = 1;
                updateQty(input.closest('.cart-item'), qty - getCurrentQty(input.closest('.cart-item')));
            };
        });
        cartItemsDiv.querySelectorAll('.cart-item-remove').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const cartItem = link.closest('.cart-item');
                const id = cartItem.dataset.id;
                const index = parseInt(cartItem.dataset.index);
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCart();
            };
        });
    }

    function getCurrentQty(itemEl) {
        return parseInt(itemEl.querySelector('input[type="number"]').value);
    }

    function updateQty(itemEl, change) {
        const id = itemEl.dataset.id;
        const item = cart.find(i => i.id == id);
        item.qty = Math.max(1, item.qty + change);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    checkoutBtn.onclick = () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        window.location.href = 'checkout.html';
    };

    renderCart();
});