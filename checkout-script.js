// EmailJS Configuration
const EMAILJS_CONFIG = {
    serviceId: '',
    templateId: 'template_vyybbfy', 
    publicKey: 'upkCeDo4tEzBJJmAL' 
};

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_CONFIG.publicKey);
}

// Smart Locker Address Autocomplete
class SmartLockerAutocomplete {
    constructor() {
        this.sheetId = '1hXeaURQ8WbLqtgSrpIexfywAC-w7P2RTgNkqsER2VQA';
        this.addresses = [];
        this.filteredAddresses = [];
        this.selectedIndex = -1;
        this.isLoading = false;
        
        this.searchInput = document.getElementById('addressSearch');
        this.dropdown = document.getElementById('addressDropdown');
        this.loadingEl = document.getElementById('addressLoading');
        
        this.init();
    }
    
    async init() {
        if (!this.searchInput) return;
        
        // Load addresses when shipping is selected
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value) {
                this.handleSearch(this.searchInput.value);
            }
        });
        this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.address-autocomplete-wrapper')) {
                this.hideDropdown();
            }
        });
    }
    
    async loadAddresses() {
        if (this.isLoading || this.addresses.length > 0) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Try to get from cache first
            const cached = localStorage.getItem('smartLockerAddresses');
            const cacheTime = localStorage.getItem('smartLockerAddressesTime');
            const now = Date.now();
            
            // Use cache if less than 24 hours old
            if (cached && cacheTime && (now - parseInt(cacheTime)) < 86400000) {
                this.addresses = JSON.parse(cached);
                this.hideLoading();
                this.isLoading = false;
                return;
            }
            
            // Fetch from Google Sheets
            const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            
            // Parse Google Sheets JSON response
            // Google Sheets returns: google.visualization.Query.setResponse({...json...});
            // Remove the wrapper function call
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error('無法解析 Google Sheets 數據格式');
            }
            
            const jsonText = text.substring(jsonStart, jsonEnd);
            const json = JSON.parse(jsonText);
            const rows = json.table.rows;
            
            this.addresses = [];
            rows.forEach((row, index) => {
                if (index === 0) return; // Skip header row
                const cells = row.c;
                if (cells && cells.length > 0) {
                    // Try to get address from first column, or combine all columns
                    let address = '';
                    cells.forEach((cell, cellIndex) => {
                        if (cell && cell.v) {
                            const value = String(cell.v).trim();
                            if (value) {
                                if (cellIndex === 0) {
                                    address = value;
                                } else {
                                    address += ' ' + value;
                                }
                            }
                        }
                    });
                    if (address) {
                        this.addresses.push(address.trim());
                    }
                }
            });
            
            // Cache the addresses
            localStorage.setItem('smartLockerAddresses', JSON.stringify(this.addresses));
            localStorage.setItem('smartLockerAddressesTime', now.toString());
            
        } catch (error) {
            console.error('載入智能櫃地址失敗:', error);
            // Fallback: try to use cached data even if old
            const cached = localStorage.getItem('smartLockerAddresses');
            if (cached) {
                try {
                    this.addresses = JSON.parse(cached);
                    console.log('使用緩存的智能櫃地址數據');
                } catch (parseError) {
                    console.error('解析緩存數據失敗:', parseError);
                    this.addresses = [];
                }
            } else {
                this.addresses = [];
                // Show error message to user
                if (this.searchInput) {
                    this.searchInput.placeholder = '無法載入智能櫃地址，請手動輸入';
                }
            }
        }
        
        this.hideLoading();
        this.isLoading = false;
    }
    
    handleSearch(query) {
        if (!query || query.length < 1) {
            this.hideDropdown();
            return;
        }
        
        const searchTerm = query.toLowerCase().trim();
        this.filteredAddresses = this.addresses.filter(addr => 
            addr.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limit to 10 results
        
        if (this.filteredAddresses.length > 0) {
            this.showDropdown();
        } else {
            this.hideDropdown();
        }
    }
    
    showDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.innerHTML = '';
        this.filteredAddresses.forEach((addr, index) => {
            const item = document.createElement('div');
            item.className = 'address-dropdown-item';
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            }
            item.textContent = addr;
            item.addEventListener('click', () => this.selectAddress(addr));
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateDropdownSelection();
            });
            this.dropdown.appendChild(item);
        });
        
        this.dropdown.style.display = 'block';
    }
    
    hideDropdown() {
        if (this.dropdown) {
            this.dropdown.style.display = 'none';
        }
        this.selectedIndex = -1;
    }
    
    updateDropdownSelection() {
        const items = this.dropdown.querySelectorAll('.address-dropdown-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    selectAddress(address) {
        this.searchInput.value = address;
        this.hideDropdown();
        this.searchInput.focus();
    }
    
    handleKeyDown(e) {
        if (!this.dropdown || this.dropdown.style.display === 'none') return;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredAddresses.length - 1);
                this.updateDropdownSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateDropdownSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.filteredAddresses[this.selectedIndex]) {
                    this.selectAddress(this.filteredAddresses[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }
    
    showLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'block';
        }
    }
    
    hideLoading() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'none';
        }
    }
    
    async ensureAddressesLoaded() {
        if (this.addresses.length === 0 && !this.isLoading) {
            await this.loadAddresses();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('checkoutForm');
    const totalEl = document.getElementById('finalTotal');
    const savedTotal = localStorage.getItem('checkoutTotal') || '0.00';
    totalEl.textContent = `$${savedTotal}`;

    // Initialize smart locker autocomplete
    const autocomplete = new SmartLockerAutocomplete();

    // Handle delivery method change
    const deliveryMethodInputs = form.querySelectorAll('input[name="deliveryMethod"]');
    const addressField = document.getElementById('addressField');
    const addressInput = document.getElementById('addressSearch');

    deliveryMethodInputs.forEach(input => {
        input.addEventListener('change', async (e) => {
            if (e.target.value === 'shipping') {
                // Show address field for shipping
                addressField.style.display = 'block';
                addressInput.required = true;
                // Load addresses when shipping is selected
                await autocomplete.ensureAddressesLoaded();
            } else {
                // Hide address field for pickup
                addressField.style.display = 'none';
                addressInput.required = false;
                addressInput.value = ''; // Clear address when switching to pickup
                autocomplete.hideDropdown();
            }
        });
    });

    // Smooth scroll to payment form
    const paymentFormLink = document.querySelector('a[href="#payment-form"]');
    if (paymentFormLink) {
        paymentFormLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('payment-form').scrollIntoView({ behavior: 'smooth' });
        });
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        
        // Get delivery method
        const deliveryMethod = form.querySelector('input[name="deliveryMethod"]:checked').value;

        // Validate and sanitize shipping information
        const name = form.name.value.trim().slice(0, 100); // Limit length
        const email = form.email.value.trim().slice(0, 100);
        const phone = form.phone.value.trim().slice(0, 20);
        const addressInput = document.getElementById('addressSearch');
        const address = deliveryMethod === 'shipping' ? (addressInput ? addressInput.value.trim().slice(0, 200) : '') : '';

        // Validate required fields
        if (!name || !email || !phone) {
            return alert('請填寫完整的資料 Please fill in all required information');
        }

        // Validate address only if shipping method is selected
        if (deliveryMethod === 'shipping' && !address) {
            return alert('請填寫郵寄地址 Please fill in shipping address');
        }

        // Enhanced email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email)) {
            return alert('請輸入有效的電子郵件地址 Please enter a valid email address');
        }

        // Validate phone (basic check)
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(phone) || phone.length < 8) {
            return alert('請輸入有效的電話號碼 Please enter a valid phone number');
        }

        // Save order to history (using email as identifier)
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const orderId = 'ORD-' + Date.now();
            const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
            // Calculate delivery date (7 days from now)
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 7);
            orders.push({
                id: orderId,
            userEmail: email,
            userName: name,
            userPhone: phone,
            deliveryMethod: deliveryMethod,
            userAddress: address || (deliveryMethod === 'pickup' ? '面交 Pickup' : ''),
                total: savedTotal,
                status: 'Processing',
                date: new Date().toISOString(),
                deliveryDate: deliveryDate.toISOString(),
                items: cartItems
            });
            localStorage.setItem('orders', JSON.stringify(orders));

        // Escape HTML to prevent XSS
        // escapeHtml function is now in common.js as window.escapeHtml

        // Send order notification email via EmailJS
        function sendOrderNotification() {
            // Format items list for email
            const itemsList = cartItems.map((item, idx) => {
                return `${idx + 1}. ${item.name} x${item.qty} - $${(item.price * item.qty).toFixed(2)} HKD`;
            }).join('\n');

            // Format delivery info
            const deliveryInfo = deliveryMethod === 'pickup' 
                ? '配送方式：面交 Pickup' 
                : `配送方式：郵寄 Shipping\n收貨地址：${address}`;

            // Email template parameters
            const templateParams = {
                order_id: orderId,
                order_date: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' }),
                order_total: `$${savedTotal} HKD`,
                customer_name: name,
                customer_phone: phone,
                customer_email: email,
                delivery_method: deliveryMethod === 'pickup' ? '面交 Pickup' : '郵寄 Shipping',
                delivery_address: address || '面交 Pickup',
                items_list: itemsList,
                items_count: cartItems.reduce((sum, item) => sum + item.qty, 0),
                to_email: 'neonhk2025@gmail.com'
            };

            // Send email if EmailJS is configured
            if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.templateId !== 'YOUR_TEMPLATE_ID' && EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
                emailjs.send(
                    EMAILJS_CONFIG.serviceId,
                    EMAILJS_CONFIG.templateId,
                    templateParams
                )
                .then(function(response) {
                    console.log('訂單通知郵件發送成功！', response.status, response.text);
                }, function(error) {
                    console.log('訂單通知郵件發送失敗', error);
                    // 即使郵件發送失敗，也不影響訂單處理
                });
            } else {
                console.log('EmailJS 尚未配置，請參考 EMAILJS_SETUP.md 完成設置');
            }
        }

        // Send notification email
        sendOrderNotification();

        localStorage.removeItem('cart');
        localStorage.removeItem('checkoutTotal');
        
        // Create success page safely
        const successDiv = document.createElement('div');
        successDiv.style.cssText = 'min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0f0f0f; color:#ffd700; text-align:center; padding:20px;';
        
        const h1 = document.createElement('h1');
        h1.textContent = '訂單已確認！';
        h1.style.cssText = 'font-size:60px; margin-bottom:20px;';
        successDiv.appendChild(h1);
        
        const h2 = document.createElement('h2');
        h2.textContent = 'Order Confirmed!';
        h2.style.cssText = 'font-size:40px; margin-bottom:30px;';
        successDiv.appendChild(h2);
        
        const totalP = document.createElement('p');
        const escapedTotal = window.escapeHtml ? window.escapeHtml(savedTotal) : savedTotal;
        totalP.innerHTML = `<strong>總金額 Total: $${escapedTotal} HKD</strong>`;
        totalP.style.cssText = 'font-size:22px; color:#ffd700; margin:20px 0;';
        successDiv.appendChild(totalP);
        
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'background:#222; padding:30px; border-radius:15px; margin:30px 0; max-width:600px;';
        
        const infoP1 = document.createElement('p');
        infoP1.textContent = '您的訂單已成功建立。請使用 FPS、PAYME 或支付寶完成付款。';
        infoP1.style.cssText = 'font-size:18px; color:#aaa; line-height:1.8; margin-bottom:20px;';
        infoDiv.appendChild(infoP1);
        
        const infoP2 = document.createElement('p');
        infoP2.textContent = 'Your order has been created successfully. Please complete payment using FPS, PAYME or Alipay.';
        infoP2.style.cssText = 'font-size:18px; color:#aaa; line-height:1.8;';
        infoDiv.appendChild(infoP2);
        
        successDiv.appendChild(infoDiv);
        
        const orderDiv = document.createElement('div');
        orderDiv.style.cssText = 'margin-top:20px; padding:20px; background:#222; border-radius:10px; max-width:600px;';
        
        const orderLabel = document.createElement('p');
        orderLabel.innerHTML = '<strong>訂單編號 Order ID:</strong>';
        orderLabel.style.cssText = 'color:#ffd700; text-align:center; margin-bottom:15px;';
        orderDiv.appendChild(orderLabel);
        
        // Order ID with spacing
        const orderIdP = document.createElement('p');
        orderIdP.textContent = orderId;
        orderIdP.style.cssText = 'color:#fff; text-align:center; font-size:20px; font-family:monospace; margin:0 0 15px 0;';
        orderDiv.appendChild(orderIdP);
        
        // Copy Order ID button (separated by one line)
        const copyOrderIdBtn = document.createElement('button');
        copyOrderIdBtn.textContent = '📋 複製訂單編號 Copy Order ID';
        copyOrderIdBtn.style.cssText = 'padding:10px 20px; background:linear-gradient(135deg, #ffd700, #ffed4e); color:#000; border:none; border-radius:50px; font-weight:bold; cursor:pointer; transition:0.3s; font-size:14px;';
        copyOrderIdBtn.onclick = () => {
            navigator.clipboard.writeText(orderId).then(() => {
                copyOrderIdBtn.textContent = '✅ 已複製！';
                copyOrderIdBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                setTimeout(() => {
                    copyOrderIdBtn.textContent = '📋 複製訂單編號 Copy Order ID';
                    copyOrderIdBtn.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = orderId;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                copyOrderIdBtn.textContent = '✅ 已複製！';
                copyOrderIdBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                setTimeout(() => {
                    copyOrderIdBtn.textContent = '📋 複製訂單編號 Copy Order ID';
                    copyOrderIdBtn.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
                }, 2000);
            });
        };
        orderDiv.appendChild(copyOrderIdBtn);
        
        const saveP = document.createElement('p');
        saveP.textContent = '請複製訂單編號，在提交付款證明時貼到備註欄中。Please copy the order ID and paste it in the remarks field when submitting payment proof.';
        saveP.style.cssText = 'color:#aaa; text-align:center; margin-top:15px; font-size:14px;';
        orderDiv.appendChild(saveP);
        successDiv.appendChild(orderDiv);

        // Submit Payment Proof section (before Next Step button) - Button to open Google Form
        const paymentProofSection = document.createElement('div');
        paymentProofSection.style.cssText = 'max-width:800px; margin:30px auto 0; background:#222; padding:30px; border-radius:15px; border:2px solid rgba(255, 215, 0, 0.3); text-align:center;';
        
        const paymentProofTitle = document.createElement('h3');
        paymentProofTitle.textContent = '提交付款證明 Submit Payment Proof';
        paymentProofTitle.style.cssText = 'color:#ffd700; margin-bottom:20px; font-size:24px;';
        paymentProofSection.appendChild(paymentProofTitle);
        
        const paymentProofP = document.createElement('p');
        paymentProofP.style.cssText = 'color:#aaa; margin-bottom:25px; font-size:16px; line-height:1.8;';
        paymentProofP.innerHTML = '請完成付款後，點擊下方按鈕上傳付款證明截圖並提交。<br>Please complete payment, then click the button below to upload payment proof screenshot and submit.';
        paymentProofSection.appendChild(paymentProofP);
        
        const tipP = document.createElement('p');
        tipP.style.cssText = 'color:#ffd700; margin-bottom:25px; font-size:15px; font-weight:bold; padding:15px; background:rgba(255, 215, 0, 0.1); border-radius:8px;';
        tipP.innerHTML = '💡 重要提示：<br>請先複製上方訂單編號，然後在新打開的表單中貼上<br>Important: Please copy the Order ID above, then paste it in the form';
        paymentProofSection.appendChild(tipP);
        
        // Large prominent button to open Google Form in new window
        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.innerHTML = '<span style="font-size:20px; margin-right:10px;">📤</span>上傳付款證明截圖並提交<br><span style="font-size:14px; opacity:0.8;">Upload Payment Proof & Submit</span>';
        submitBtn.style.cssText = 'display:inline-block; padding:20px 50px; background:linear-gradient(135deg, #ffd700, #ffed4e); color:#000; border:none; border-radius:50px; font-weight:bold; cursor:pointer; transition:0.3s; font-size:18px; box-shadow:0 4px 15px rgba(255, 215, 0, 0.4); width:100%; max-width:500px;';
        submitBtn.onmouseover = function() {
            this.style.background = 'linear-gradient(135deg, #ffed4e, #fff)';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)';
        };
        submitBtn.onmouseout = function() {
            this.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
        };
        submitBtn.onclick = function() {
            // Open Google Form in a new window with optimized size
            const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSe_V_LWw03fqCdVXYbtncfrqMSrfNvpQsdzpx7Wm7b9RMfwcg/viewform?usp=header';
            const windowFeatures = 'width=900,height=800,scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no,status=no';
            window.open(formUrl, 'PaymentProofForm', windowFeatures);
            
            // Update button to show it's been clicked
            this.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            this.innerHTML = '<span style="font-size:20px; margin-right:10px;">✅</span>表單已打開，請在新窗口中填寫<br><span style="font-size:14px; opacity:0.8;">Form opened, please fill in the new window</span>';
            setTimeout(() => {
                this.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
                this.innerHTML = '<span style="font-size:20px; margin-right:10px;">📤</span>上傳付款證明截圖並提交<br><span style="font-size:14px; opacity:0.8;">Upload Payment Proof & Submit</span>';
            }, 3000);
        };
        paymentProofSection.appendChild(submitBtn);
        
        const noteP = document.createElement('p');
        noteP.style.cssText = 'color:#666; margin-top:20px; font-size:13px;';
        noteP.innerHTML = '📝 注意：由於需要上傳檔案，表單將在新窗口中打開以確保正常運作<br>Note: Form opens in a new window to support file uploads';
        paymentProofSection.appendChild(noteP);
        
        successDiv.appendChild(paymentProofSection);

        // Next page button
        const nextPageBtn = document.createElement('button');
        nextPageBtn.textContent = '下一步 Next Step';
        nextPageBtn.style.cssText = 'margin-top:40px; padding:15px 50px; background:linear-gradient(135deg, #ffd700, #ffed4e); color:#000; border:none; border-radius:50px; font-weight:bold; cursor:pointer; transition:0.3s; font-size:18px;';
        nextPageBtn.onclick = () => {
            showPaymentProofPage();
        };
        successDiv.appendChild(nextPageBtn);

        // Format items list for second page
        const itemsList = cartItems.map((item, idx) => {
            return `${idx + 1}. ${item.name} x${item.qty} - $${(item.price * item.qty).toFixed(2)}`;
        }).join('\n');

        const detailsText = `訂單編號 Order ID: ${orderId}
訂單總額 Total Amount: $${savedTotal} HKD
客戶姓名 Name: ${name}
客戶電話 Phone: ${phone}
客戶 Email: ${email}
配送方式 Delivery Method: ${deliveryMethod === 'pickup' ? '面交 Pickup' : '郵寄 Shipping'}${deliveryMethod === 'shipping' ? '\n收貨地址 Address: ' + address : ''}

商品清單 Items:
${itemsList}

請在提交付款證明時包含以上信息。Please include the above information when submitting payment proof.`;

            // Function to show payment proof page (page 2)
        function showPaymentProofPage() {
            const paymentProofDiv = document.createElement('div');
            paymentProofDiv.style.cssText = 'min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0f0f0f; color:#ffd700; text-align:center; padding:20px;';
            
            const h3 = document.createElement('h2');
            h3.textContent = '提交付款證明 Submit Payment Proof';
            h3.style.cssText = 'font-size:36px; margin-bottom:30px; color:#ffd700;';
            paymentProofDiv.appendChild(h3);

            // Order details section (first)
            const orderDetailsDiv = document.createElement('div');
            orderDetailsDiv.style.cssText = 'margin-top:30px; padding:25px; background:#222; border-radius:15px; max-width:700px; border:2px solid rgba(255, 215, 0, 0.3);';
            
            const detailsTitle = document.createElement('h3');
            detailsTitle.textContent = '📋 訂單詳情 / Order Details';
            detailsTitle.style.cssText = 'color:#ffd700; text-align:center; margin-bottom:20px; font-size:20px;';
            orderDetailsDiv.appendChild(detailsTitle);

            const detailsTextarea = document.createElement('textarea');
            detailsTextarea.value = detailsText;
            detailsTextarea.readOnly = true;
            detailsTextarea.style.cssText = 'width:100%; min-height:250px; padding:15px; background:#1a1a1a; color:#fff; border:2px solid rgba(255, 215, 0, 0.3); border-radius:8px; font-family:monospace; font-size:14px; line-height:1.6; resize:vertical;';
            orderDetailsDiv.appendChild(detailsTextarea);

            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = '💾 下載訂單 Download Order';
            downloadBtn.style.cssText = 'margin-top:15px; padding:12px 25px; background:linear-gradient(135deg, #ffd700, #ffed4e); color:#000; border:none; border-radius:50px; font-weight:bold; cursor:pointer; transition:0.3s; width:100%;';
            downloadBtn.onclick = () => {
                const blob = new Blob([detailsText], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Order_${orderId}_${new Date().getTime()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                downloadBtn.textContent = '✅ 已下載！ Downloaded!';
                downloadBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                setTimeout(() => {
                    downloadBtn.textContent = '💾 下載訂單 Download Order';
                    downloadBtn.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
                }, 2000);
            };
            orderDetailsDiv.appendChild(downloadBtn);

            const reminderP = document.createElement('p');
            reminderP.innerHTML = '<strong style="color:#ffd700;">💡 提示：</strong>請下載訂單詳情，保障雙方。Please download order details to protect both parties.';
            reminderP.style.cssText = 'color:#aaa; text-align:center; margin-top:15px; font-size:14px; line-height:1.6;';
            orderDetailsDiv.appendChild(reminderP);

            paymentProofDiv.appendChild(orderDetailsDiv);

            // Continue shopping button (below order details)
            const continueLink = document.createElement('a');
            continueLink.href = 'index.html';
            continueLink.textContent = '繼續購物 Continue Shopping';
            continueLink.style.cssText = 'padding:15px 40px; background:linear-gradient(135deg, #ffd700, #ffed4e); color:#000; border-radius:50px; text-decoration:none; font-weight:bold; transition:0.3s; font-size:18px; display:inline-block; margin-top:40px;';
            continueLink.onmouseover = () => continueLink.style.background = 'linear-gradient(135deg, #ffed4e, #fff)';
            continueLink.onmouseout = () => continueLink.style.background = 'linear-gradient(135deg, #ffd700, #ffed4e)';
            paymentProofDiv.appendChild(continueLink);
            
            // Replace current page with payment proof page
            document.body.innerHTML = '';
            document.body.appendChild(paymentProofDiv);
        }
        
        document.body.innerHTML = '';
        document.body.appendChild(successDiv);
    };
});