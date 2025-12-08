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
                        // Rotate button icon (optional visual feedback)
                        langBtn.style.transform = 'rotate(0deg)';
                    } else {
                        // Open dropdown with animation
                        dropdown.classList.add('active');
                        // Rotate button icon (optional visual feedback)
                        langBtn.style.transform = 'rotate(180deg)';
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

