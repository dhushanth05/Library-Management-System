// Dashboard functionality
const dashboardModule = (() => {
    // Wait for the main.js to fully load and initialize
    let mainLoaded = false;
    
    // Check for the availability of utility functions
    function checkUtilsAvailable() {
        return (
            typeof window.fetchAPI === 'function' &&
            typeof window.showToast === 'function' &&
            typeof window.formatDate === 'function'
        );
    }
    // State
    let stats = {
        totalBooks: 0,
        availableBooks: 0,
        totalMembers: 0,
        activeMembers: 0,
        totalBorrowed: 0,
        overdue: 0,
        pendingFines: 0
    };
    
    // DOM Elements
    let booksCount = document.getElementById('total-books');
    let availableBooksCount = document.getElementById('available-books');
    let membersCount = document.getElementById('total-members');
    let activeMembersCount = document.getElementById('active-members');
    let borrowedCount = document.getElementById('books-borrowed');
    let overdueCount = document.getElementById('overdue-books');
    let pendingFinesAmount = document.getElementById('pending-fines-amount');
    let recentTransactionsList = document.getElementById('recent-transactions-list');
    
    // Initialize dashboard
    function init() {
        console.log('Initializing dashboard module');
        
        // Check if utility functions are available
        if (!checkUtilsAvailable()) {
            console.log('Required utility functions not available yet. Will retry in 500ms');
            setTimeout(() => {
                if (checkUtilsAvailable()) {
                    console.log('Utility functions now available, loading dashboard');
                    initializeDashboard();
                } else {
                    console.error('Utility functions still not available, falling back to defaults');
                    // Apply fallback values
                    updateUIWithFallbackValues();
                }
            }, 500);
        } else {
            initializeDashboard();
        }
    }
    
    // Initialize dashboard after utilities are available
    function initializeDashboard() {
        loadDashboardStats();
        loadRecentTransactions();
    }
    
    // Update UI with fallback values if API calls fail
    function updateUIWithFallbackValues() {
        const elements = {
            'total-books': '0',
            'available-books': '0',
            'total-members': '0',
            'active-members': '0',
            'books-borrowed': '0',
            'overdue-books': '0',
            'pending-fines-amount': '₹0.00'
        };
        
        // Update each element with fallback value
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Update recent transactions list with empty message
        if (recentTransactionsList) {
            recentTransactionsList.innerHTML = '<tr><td colspan="5" class="text-center">No recent transactions available</td></tr>';
        }
    }
    
    // Load dashboard statistics
    async function loadDashboardStats() {
        try {
            if (!checkUtilsAvailable()) {
                console.log('fetchAPI not available for loadDashboardStats');
                return;
            }
            
            // Fetch dashboard stats from API - try both dashboard endpoint and fallback
            let data;
            try {
                // First try the dedicated dashboard stats endpoint
                data = await window.fetchAPI('/dashboard/stats');
            } catch (apiError) {
                console.log('Dashboard stats endpoint failed, trying fallback methods');
                
                // Fallback: gather stats from individual endpoints
                try {
                    const [books, members, transactions] = await Promise.all([
                        window.fetchAPI('/books'),
                        window.fetchAPI('/members'),
                        window.fetchAPI('/transactions?status=borrowed')
                    ]);
                    
                    // Calculate stats from response data
                    data = {
                        totalBooks: books.totalBooks || books.books?.length || 0,
                        availableBooks: books.availableBooks || 0,
                        totalMembers: members.totalMembers || members.members?.length || 0,
                        activeMembers: members.activeMembers || 0,
                        totalBorrowed: transactions.totalTransactions || transactions.transactions?.length || 0,
                        overdue: 0, // No simple way to calculate this in fallback
                        pendingFines: 0 // No simple way to calculate this in fallback
                    };
                } catch (fallbackError) {
                    console.error('Fallback stats loading also failed:', fallbackError);
                    updateUIWithFallbackValues();
                    return;
                }
            }
            
            // Update state
            stats = data;
            
            // Update UI - with null safety
            if (booksCount) booksCount.textContent = data.totalBooks || 0;
            if (availableBooksCount) availableBooksCount.textContent = data.availableBooks || 0;
            if (membersCount) membersCount.textContent = data.totalMembers || 0;
            if (activeMembersCount) activeMembersCount.textContent = data.activeMembers || 0;
            if (borrowedCount) borrowedCount.textContent = data.totalBorrowed || 0;
            if (overdueCount) overdueCount.textContent = data.overdue || 0;
            
            // Handle the currency formatting carefully to avoid errors
            if (pendingFinesAmount) {
                const amount = data.pendingFines || 0;
                pendingFinesAmount.textContent = `₹${amount.toFixed ? amount.toFixed(2) : '0.00'}`;
            }
            
            console.log('Dashboard stats loaded successfully:', data);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            // Only show toast if the utility is available
            if (typeof window.showToast === 'function') {
                window.showToast('Failed to load dashboard statistics', 'error');
            }
            updateUIWithFallbackValues();
        }
    }
    
    // Load recent transactions
    async function loadRecentTransactions() {
        try {
            if (!checkUtilsAvailable()) {
                console.log('fetchAPI not available for loadRecentTransactions');
                return;
            }

            // Fetch recent transactions from API
            const data = await window.fetchAPI('/transactions?limit=5&sort=createdAt&order=desc');
            
            // Clear existing transactions
            if (recentTransactionsList) {
                recentTransactionsList.innerHTML = '';
            } else {
                console.log('Recent transactions list element not found');
                return;
            }
            
            // Check if there are any transactions
            if (!data.transactions || data.transactions.length === 0) {
                recentTransactionsList.innerHTML = '<tr><td colspan="5" class="text-center">No recent transactions</td></tr>';
                return;
            }
            
            // Render transactions
            data.transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                // Create table cells
                const idCell = document.createElement('td');
                idCell.textContent = transaction._id ? transaction._id.substring(0, 8) + '...' : 'N/A';
                
                const bookCell = document.createElement('td');
                bookCell.textContent = transaction.bookTitle || transaction.book?.title || 'Unknown';
                
                const memberCell = document.createElement('td');
                memberCell.textContent = transaction.memberName || transaction.member?.name || 'Unknown';
                
                const dateCell = document.createElement('td');
                dateCell.textContent = typeof window.formatDate === 'function' ? 
                    window.formatDate(transaction.borrowDate) : 
                    new Date(transaction.borrowDate).toLocaleDateString();
                
                const statusCell = document.createElement('td');
                const statusBadge = document.createElement('span');
                statusBadge.className = `badge ${getStatusBadgeColor(transaction.status)}`;
                statusBadge.textContent = transaction.status;
                statusCell.appendChild(statusBadge);
                
                // Add cells to row
                row.appendChild(idCell);
                row.appendChild(bookCell);
                row.appendChild(memberCell);
                row.appendChild(dateCell);
                row.appendChild(statusCell);
                
                // Add row to table
                recentTransactionsList.appendChild(row);
            });
            
            console.log('Recent transactions loaded successfully');
        } catch (error) {
            console.error('Error loading recent transactions:', error);
            // Only show toast if the utility is available
            if (typeof window.showToast === 'function') {
                window.showToast('Failed to load recent transactions', 'error');
            }
            
            // Show empty state
            if (recentTransactionsList) {
                recentTransactionsList.innerHTML = '<tr><td colspan="5" class="text-center">Failed to load transactions</td></tr>';
            }
        }
    }
    
    // Public API
    return {
        init,
        loadDashboardStats,
        loadRecentTransactions,
        updateUIWithFallbackValues
    };
})();

// Initialize the module when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Don't automatically initialize - let auth.js handle it
    console.log('Dashboard module loaded and ready for initialization');
});

// Make dashboardModule globally available
window.dashboardModule = dashboardModule;
