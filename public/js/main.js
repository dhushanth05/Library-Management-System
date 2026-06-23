// Main JavaScript file for the Library Management System

// Toast notification system
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Make showToast globally available
window.showToast = showToast;

// Modal functionality
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close');

// Close modal when clicking the close button
if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Close modal when clicking outside the modal content
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Open modal
function openModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
}

// Make modal functions globally available
window.openModal = openModal;
window.closeModal = closeModal;

// API helper functions
const API_URL = '/api';

// Fetch API wrapper with authentication
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        // Check if the endpoint already starts with the API_URL prefix
        const url = endpoint.startsWith(API_URL) ? endpoint : `${API_URL}${endpoint}`;
        const response = await fetch(url, mergedOptions);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            
            // If response is not OK and we got text, try to show meaningful error
            if (!response.ok) {
                throw new Error(`Server error: ${text}`);
            }
            
            // If response is OK but not JSON, return empty object or text
            return text ? { message: text } : {};
        }
        
        if (!response.ok) {
            throw new Error(data.msg || data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Make fetchAPI globally available
window.fetchAPI = fetchAPI;

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make formatDate globally available
window.formatDate = formatDate;

// Format currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

// Make formatCurrency globally available
window.formatCurrency = formatCurrency;

// Create pagination controls
function createPagination(currentPage, totalPages, onPageChange) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&laquo; Prev';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
    pagination.appendChild(prevBtn);
    
    // Page buttons
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? 'active' : '';
        pageBtn.addEventListener('click', () => onPageChange(i));
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next &raquo;';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
    pagination.appendChild(nextBtn);
    
    return pagination;
}

// Make createPagination globally available
window.createPagination = createPagination;

// Admin Dashboard module
const adminDashboardModule = (() => {
    // DOM elements
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li[data-page]');
    const contentPages = document.querySelectorAll('.content-page');
    
    // Initialize
    function init() {
        // Add event listeners
        if (toggleSidebarBtn) {
            toggleSidebarBtn.addEventListener('click', toggleSidebar);
        }
        
        // Add click event to sidebar menu items
        sidebarMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageName = item.getAttribute('data-page');
                showPage(pageName);
            });
        });
        
        // Load dashboard data
        loadDashboardData();
        
        // Initialize modules
        if (window.booksModule) window.booksModule.init();
        if (window.membersModule) window.membersModule.init();
        if (window.transactionsModule) window.transactionsModule.init();
        if (window.finesModule) window.finesModule.init();
        if (window.reportsModule) window.reportsModule.init();
        if (window.settingsModule) window.settingsModule.init();
    }
    
    // Toggle sidebar
    function toggleSidebar() {
        document.body.classList.toggle('sidebar-collapsed');
    }
    
    // Show page
    function showPage(pageName) {
        // Update active menu item
        sidebarMenuItems.forEach(item => {
            if (item.getAttribute('data-page') === pageName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Show selected page
        contentPages.forEach(page => {
            if (page.id === `${pageName}-page`) {
                page.classList.remove('hidden');
            } else {
                page.classList.add('hidden');
            }
        });
        
        // Refresh page data if needed
        refreshPageData(pageName);
    }
    
    // Refresh page data
    function refreshPageData(pageName) {
        switch (pageName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'books':
                if (window.booksModule) window.booksModule.loadBooks();
                break;
            case 'members':
                if (window.membersModule) window.membersModule.loadMembers();
                break;
            case 'transactions':
                if (window.transactionsModule) window.transactionsModule.loadTransactions();
                break;
            case 'fines':
                if (window.finesModule) window.finesModule.loadFines();
                break;
        }
    }
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            // Try to fetch dashboard stats - handle case where endpoint might not exist yet
            try {
                const data = await window.fetchAPI('/dashboard/stats');
                
                // Update dashboard stats if elements exist
                const booksCount = document.getElementById('books-count');
                if (booksCount) booksCount.textContent = data.totalBooks || 0;
                
                const availableBooksCount = document.getElementById('available-books-count');
                if (availableBooksCount) availableBooksCount.textContent = data.availableBooks || 0;
                
                const membersCount = document.getElementById('members-count');
                if (membersCount) membersCount.textContent = data.totalMembers || 0;
                
                const activeMembersCount = document.getElementById('active-members-count');
                if (activeMembersCount) activeMembersCount.textContent = data.activeMembers || 0;
                
                const borrowedCount = document.getElementById('borrowed-count');
                if (borrowedCount) borrowedCount.textContent = data.totalBorrowed || 0;
                
                const overdueCount = document.getElementById('overdue-count');
                if (overdueCount) overdueCount.textContent = data.overdue || 0;
                
                const pendingFinesAmount = document.getElementById('pending-fines-amount');
                if (pendingFinesAmount) pendingFinesAmount.textContent = `₹${(data.pendingFines || 0).toFixed(2)}`;
            } catch (statsError) {
                console.log('Dashboard stats endpoint not available:', statsError);
                // Populate with default values to prevent errors
                const statElements = [
                    'books-count', 'available-books-count', 'members-count',
                    'active-members-count', 'borrowed-count', 'overdue-count'
                ];
                
                statElements.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = '0';
                });
                
                const pendingFinesAmount = document.getElementById('pending-fines-amount');
                if (pendingFinesAmount) pendingFinesAmount.textContent = '₹0.00';
            }
            
            // Try to fetch recent transactions
            try {
                const transactionsData = await window.fetchAPI('/transactions?limit=5');
                loadRecentTransactions(transactionsData.transactions || []);
            } catch (transactionsError) {
                console.log('Transactions endpoint error:', transactionsError);
                // Handle empty transactions gracefully
                const recentTransactionsList = document.getElementById('recent-transactions-list');
                if (recentTransactionsList) {
                    recentTransactionsList.innerHTML = '<tr><td colspan="5" class="empty-message">No recent transactions available</td></tr>';
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Don't show a toast here as it can be annoying on page load
        }
    }
    
    // Load recent transactions
    function loadRecentTransactions(transactions) {
        const tableBody = document.querySelector('#recent-transactions-table tbody');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (transactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="text-center">No recent transactions</td>';
            tableBody.appendChild(row);
            return;
        }
        
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${transaction.bookId.title}</td>
                <td>${transaction.memberId.name}</td>
                <td>${formatDate(transaction.borrowDate)}</td>
                <td>${formatDate(transaction.dueDate)}</td>
                <td><span class="badge badge-${getStatusBadgeColor(transaction.status)}">${transaction.status}</span></td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Load overdue books
    function loadOverdueBooks(overdueBooks) {
        const tableBody = document.querySelector('#overdue-books-table tbody');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (overdueBooks.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="text-center">No overdue books</td>';
            tableBody.appendChild(row);
            return;
        }
        
        overdueBooks.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Calculate days overdue
            const dueDate = new Date(transaction.dueDate);
            const today = new Date();
            const timeDiff = Math.abs(today.getTime() - dueDate.getTime());
            const daysOverdue = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            // Calculate fine (₹10 per day)
            const fine = daysOverdue * 10;
            
            row.innerHTML = `
                <td>${transaction.bookId.title}</td>
                <td>${transaction.memberId.name}</td>
                <td>${formatDate(transaction.dueDate)}</td>
                <td>${daysOverdue}</td>
                <td>${formatCurrency(fine)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Get status badge color
    function getStatusBadgeColor(status) {
        switch (status) {
            case 'borrowed':
                return 'primary';
            case 'returned':
                return 'success';
            case 'overdue':
                return 'danger';
            default:
                return 'secondary';
        }
    }
    
    // Public API
    return {
        init,
        showPage
    };
})();

// Initialize admin dashboard
adminDashboardModule.init();

// Make admin dashboard module globally available
window.adminDashboardModule = adminDashboardModule;
