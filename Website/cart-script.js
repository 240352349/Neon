document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItemsDiv = document.getElementById('cartItems');
    const emptyMsg = document.getElementById('emptyMsg');
    const subtotalEl = document.getElementById('subtotal');
    const deliveryEl = document.getElementById('delivery');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartCountEls = document.querySelectorAll('.cart-count');

    // escapeHtml function is now in common.js as window.escapeHtml

    // Validate and sanitize cart item data
    function validateCartItem(item, index) {
        if (!item || typeof item !== 'object') return null;
        return {
            id: String(item.id || ''),
            name: String(item.name || ''),
            price: parseFloat(item.price) || 0,
            qty: Math.max(1, parseInt(item.qty) || 1),
            images: Array.isArray(item.images) ? item.images.filter(img => typeof img === 'string') : (item.img ? [String(item.img)] : []),
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
            
            // Image container
            const imageDiv = document.createElement('div');
            imageDiv.className = 'cart-item-image';
            if (item.images[0]) {
                // Use CSS custom property to safely set background image
                const safeUrl = window.escapeHtml ? window.escapeHtml(item.images[0]) : item.images[0];
                imageDiv.style.backgroundImage = `url('${safeUrl.replace(/'/g, "\\'")}')`;
            }
            cartItem.appendChild(imageDiv);
            
            // Details container
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'cart-item-details';
            
            const h4 = document.createElement('h4');
            h4.textContent = item.name;
            detailsDiv.appendChild(h4);
            
            const priceP = document.createElement('p');
            priceP.textContent = `$${item.price.toFixed(2)}`;
            detailsDiv.appendChild(priceP);
            
            // Color selector if multiple images
            if (item.images.length > 1) {
                const colorSelector = document.createElement('div');
                colorSelector.className = 'color-selector';
                
                const label = document.createElement('label');
                label.textContent = 'Color:';
                colorSelector.appendChild(label);
                
                const colorOptions = document.createElement('div');
                colorOptions.className = 'color-options';
                
                item.images.forEach((img, idx) => {
                    const optionLabel = document.createElement('label');
                    optionLabel.className = 'color-option';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `color-${item.id}-${index}`;
                    radio.value = `Color ${idx + 1}`;
                    radio.dataset.image = img;
                    if (idx === 0) radio.checked = true;
                    optionLabel.appendChild(radio);
                    
                    const span = document.createElement('span');
                    span.className = 'color-label';
                    span.textContent = `Color ${idx + 1}`;
                    optionLabel.appendChild(span);
                    
                    colorOptions.appendChild(optionLabel);
                });
                
                colorSelector.appendChild(colorOptions);
                detailsDiv.appendChild(colorSelector);
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
        const delivery = subtotal * 0.05;
        const total = subtotal + delivery;
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
        // Color selector change handler
        cartItemsDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.onchange = (e) => {
                const cartItem = e.target.closest('.cart-item');
                const id = cartItem.dataset.id;
                const index = parseInt(cartItem.dataset.index);
                const selectedImage = e.target.dataset.image;
                const selectedColor = e.target.value;
                
                // Update cart item
                if (cart[index] && cart[index].id == id) {
                    cart[index].selectedColor = selectedColor;
                    cart[index].selectedImage = selectedImage;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    
                    // Update displayed image
                    const imageEl = cartItem.querySelector('.cart-item-image');
                    if (imageEl) {
                        imageEl.style.backgroundImage = `url('${selectedImage}')`;
                    }
                }
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