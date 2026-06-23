// Authentication Module for Member Portal

const authModule = (() => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameDisplay = document.getElementById('user-name');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    
    // Initialize module
    function init() {
        // Check if user is logged in
        checkAuth();
        
        // Add event listeners
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }
    
    // Check authentication status
    function checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            // User is logged in
            const userData = JSON.parse(user);
            
            // Update UI
            if (userNameDisplay) {
                userNameDisplay.textContent = userData.name;
            }
            
            if (dashboardContainer) {
                dashboardContainer.classList.remove('hidden');
            }
            
            if (loginContainer) {
                loginContainer.classList.add('hidden');
            }
            
            if (registerContainer) {
                registerContainer.classList.add('hidden');
            }
            
            // Initialize other modules only after login
            initializeModules();
        } else {
            // User is not logged in
            if (dashboardContainer) {
                dashboardContainer.classList.add('hidden');
            }
            
            if (loginContainer) {
                loginContainer.classList.remove('hidden');
            }
        }
    }
    
    // Handle login form submission
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text}`);
            }
            
            if (!response.ok) {
                throw new Error(data.msg || 'Login failed');
            }
            
            // We're already on the member portal, so no need to check role
            
            // Save token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Show success message
            window.showToast('Login successful', 'success');
            
            // Update UI
            checkAuth();
        } catch (error) {
            console.error('Login error:', error);
            window.showToast(error.message, 'error');
        }
    }
    
    // Handle register form submission
    async function handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const address = document.getElementById('register-address').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            window.showToast('Passwords do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, address, password })
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text}`);
            }
            
            if (!response.ok) {
                throw new Error(data.msg || 'Registration failed');
            }
            
            // Show success message
            window.showToast('Registration successful. You can now log in.', 'success');
            
            // Clear form
            registerForm.reset();
            
            // Switch to login tab
            document.getElementById('show-login').click();
        } catch (error) {
            console.error('Registration error:', error);
            window.showToast(error.message, 'error');
        }
    }
    
    // Handle logout
    function handleLogout() {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Show message
        window.showToast('You have been logged out', 'info');
        
        // Update UI
        checkAuth();
    }
    
    // Initialize all modules
    function initializeModules() {
        // Wait a moment to ensure DOM is ready
        setTimeout(() => {
            try {
                // Load home data
                if (window.loadHomeData) {
                    window.loadHomeData();
                }
                
                // Initialize catalog module
                if (window.catalogModule) {
                    if (window.catalogModule.init) {
                        window.catalogModule.init();
                    }
                    if (window.catalogModule.loadGenres) {
                        window.catalogModule.loadGenres();
                    }
                }
                
                // Initialize books module
                if (window.booksModule && window.booksModule.init) {
                    window.booksModule.init();
                }
                
                // Initialize history module
                if (window.historyModule && window.historyModule.init) {
                    window.historyModule.init();
                }
                
                // Initialize fines module
                if (window.finesModule && window.finesModule.init) {
                    window.finesModule.init();
                }
            } catch (error) {
                console.error('Error initializing modules:', error);
            }
        }, 100);
    }
    
    // Public API
    return {
        init,
        checkAuth
    };
})();

// Make module globally available
window.authModule = authModule;
