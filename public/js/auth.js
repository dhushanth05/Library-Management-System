// Authentication related functionality
const authModule = (() => {
    // DOM Elements
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');

    // API URL
    const API_URL = '/api';

    // Initialize
    function init() {
        // Add event listeners
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (registerForm) registerForm.addEventListener('submit', handleRegister);
        if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegister);
        if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin);
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        // Check if user is logged in
        checkAuthStatus();
    }

    // Show register form
    function showRegister(e) {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    }

    // Show login form
    function showLogin(e) {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    }

    // Handle login form submission
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
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

            // Save token to localStorage
            localStorage.setItem('token', data.token);
            
            // Get user data
            await getUserData();
            
            // Show dashboard
            showDashboard();
            
            // Show success message
            showToast('Login successful', 'success');
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message, 'error');
        }
    }

    // Handle register form submission
    async function handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const address = document.getElementById('reg-address').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        // Validate password match
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
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

            // Save token to localStorage
            localStorage.setItem('token', data.token);
            
            // Get user data
            await getUserData();
            
            // Show dashboard
            showDashboard();
            
            // Show success message
            showToast('Registration successful', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            showToast(error.message, 'error');
        }
    }

    // Handle logout
    function handleLogout() {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Show login form
        dashboardContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        
        // Show success message
        showToast('Logged out successfully', 'success');
    }

    // Check if user is authenticated
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        
        if (token) {
            // Get user data
            getUserData()
                .then(() => {
                    // Show dashboard
                    showDashboard();
                })
                .catch(() => {
                    // If token is invalid, show login form
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    loginContainer.classList.remove('hidden');
                });
        } else {
            // Show login form
            loginContainer.classList.remove('hidden');
        }
    }

    // Get user data
    async function getUserData() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('No token found');
        }

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'x-auth-token': token
                }
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
                throw new Error(data.msg || 'Failed to get user data');
            }

            // Save user data to localStorage
            localStorage.setItem('user', JSON.stringify(data));
            
            // Update UI
            if (userName) userName.textContent = data.name;
            if (userRole) {
                userRole.textContent = data.role.charAt(0).toUpperCase() + data.role.slice(1);
                userRole.className = `badge badge-${getRoleBadgeColor(data.role)}`;
            }

            return data;
        } catch (error) {
            console.error('Error getting user data:', error);
            throw error;
        }
    }

    // Show dashboard or redirect to member portal
    function showDashboard() {
        // Get user data
        const userData = JSON.parse(localStorage.getItem('user'));
        
        // If user is a member, redirect to member portal
        if (userData && userData.role === 'member') {
            window.location.href = '/member';
            return;
        }
        
        // Otherwise show admin dashboard
        loginContainer.classList.add('hidden');
        registerContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        
        // Initialize dashboard
        // Ensure that the global utility functions are available before initializing
        if (window.dashboardModule) {
            // Make sure fetchAPI and other utilities are available to dashboardModule
            if (typeof window.fetchAPI !== 'function') {
                // If fetchAPI isn't directly available, use a copy from this module's closure
                window.fetchAPI = async function(endpoint, options = {}) {
                    const token = localStorage.getItem('token');
                    
                    const defaults = {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    };
                    
                    if (token) {
                        defaults.headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const config = { ...defaults, ...options };
                    
                    if (config.body && typeof config.body === 'object') {
                        config.body = JSON.stringify(config.body);
                    }
                    
                    const response = await fetch(`/api${endpoint}`, config);
                    
                    if (!response.ok) {
                        const error = await response.json().catch(() => ({
                            message: response.statusText
                        }));
                        throw new Error(error.message || 'Something went wrong');
                    }
                    
                    return response.json();
                };
                
                console.log('Attached fetchAPI function to window object');
            }
            
            // Ensure showToast is available
            if (typeof window.showToast !== 'function') {
                window.showToast = function(message, type = 'info') {
                    const toast = document.createElement('div');
                    toast.className = `toast toast-${type}`;
                    toast.textContent = message;
                    
                    const toastContainer = document.getElementById('toast-container');
                    if (toastContainer) {
                        toastContainer.appendChild(toast);
                        
                        // Auto remove after 3 seconds
                        setTimeout(() => {
                            toast.style.opacity = '0';
                            setTimeout(() => {
                                if (toastContainer.contains(toast)) {
                                    toastContainer.removeChild(toast);
                                }
                            }, 300);
                        }, 3000);
                    }
                };
                
                console.log('Attached showToast function to window object');
            }
            
            try {
                console.log('Initializing dashboard module from auth.js');
                window.dashboardModule.init();
            } catch (error) {
                console.error('Error initializing dashboard:', error);
            }
        } else {
            console.warn('Dashboard module not found, cannot initialize');
        }
    }

    // Get role badge color
    function getRoleBadgeColor(role) {
        switch (role) {
            case 'admin':
                return 'danger';
            case 'librarian':
                return 'warning';
            default:
                return 'primary';
        }
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    // Get auth token
    function getToken() {
        return localStorage.getItem('token');
    }

    // Get current user
    function getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Check if user has a specific role
    function hasRole(role) {
        const user = getCurrentUser();
        return user && user.role === role;
    }

    // Check if user is admin
    function isAdmin() {
        return hasRole('admin');
    }

    // Check if user is librarian
    function isLibrarian() {
        return hasRole('librarian') || hasRole('admin');
    }

    // Public API
    return {
        init,
        getToken,
        getCurrentUser,
        isAdmin,
        isLibrarian
    };
})();

// Initialize auth module when DOM is loaded
document.addEventListener('DOMContentLoaded', authModule.init);
