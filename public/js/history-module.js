// History Module for Member Portal
// Handles borrowing history

const historyModule = (() => {
    // DOM Elements - using let instead of const to allow reassignment
    let historyContainer = document.querySelector('.history-timeline');
    let historyPaginationContainer = document.querySelector('.history-pagination');
    
    // State
    let currentPage = 1;
    let totalPages = 1;
    
    // Initialize module
    function init() {
        console.log('Initializing history module');
        
        // Try to get DOM elements if they're not already available
        if (!historyContainer) {
            console.log('History container not found, trying to get it again');
            historyContainer = document.querySelector('.history-timeline');
        }
        
        if (!historyPaginationContainer) {
            console.log('History pagination container not found, trying to get it again');
            historyPaginationContainer = document.querySelector('.history-pagination');
        }
        
        // Check if DOM elements exist after trying to get them
        if (!historyContainer) {
            console.error('History container not found during initialization');
            return; // Exit early if the element still doesn't exist
        }
        
        console.log('History container found, loading history');
        
        // Load history
        loadHistory();
    }
    
    // Load borrowing history
    async function loadHistory() {
        try {
            // Check if historyContainer exists
            if (!historyContainer) {
                console.log('History container not found, trying to get it again');
                historyContainer = document.querySelector('.history-timeline');
                if (!historyContainer) {
                    console.error('History container element not found');
                    return; // Exit early if the element still doesn't exist
                }
            }

            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!user) {
                console.log('User not logged in, cannot load history');
                return;
            }
            
            // Show loading state
            historyContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading borrowing history...</div>';
            
            // Fetch history
            console.log(`Fetching borrowing history for member ${user._id}, page ${currentPage}`);
            // Use the exact endpoint that exists in transactionRoutes.js with proper API URL format
            // Adding a filter for completed transactions (status=returned)
            const endpoint = `transactions/member/${user._id}?status=returned&page=${currentPage}&limit=10`;
            const data = await window.fetchAPI(endpoint);
            
            // Update pagination
            totalPages = Math.ceil(data.total / data.limit);
            
            // Render history
            renderHistory(data.transactions);
            
            // Render pagination
            renderPagination();
        } catch (error) {
            console.error('Error loading borrowing history:', error);
            if (historyContainer) {
                historyContainer.innerHTML = '<div class="error">Error loading borrowing history. Please try again.</div>';
            }
        }
    }
    
    // Render borrowing history
    function renderHistory(transactions) {
        // Check if historyContainer exists
        if (!historyContainer) {
            console.log('History container not found in renderHistory, trying to get it again');
            historyContainer = document.querySelector('.history-timeline');
            if (!historyContainer) {
                console.error('History container element not found in renderHistory');
                return; // Exit early if the element still doesn't exist
            }
        }
        
        // Clear container
        historyContainer.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            historyContainer.innerHTML = '<div class="empty-message">No borrowing history found.</div>';
            return;
        }
        
        // Create history table
        const table = document.createElement('table');
        table.className = 'history-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Book</th>
                <th>Borrowed On</th>
                <th>Returned On</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        transactions.forEach(transaction => {
            const book = transaction.bookId;
            
            // Determine status
            let status = '';
            let statusClass = '';
            
            switch (transaction.status) {
                case 'borrowed':
                    status = 'Borrowed';
                    statusClass = 'status-borrowed';
                    break;
                case 'returned':
                    status = 'Returned';
                    statusClass = 'status-returned';
                    break;
                case 'overdue':
                    status = 'Overdue';
                    statusClass = 'status-overdue';
                    break;
                case 'lost':
                    status = 'Lost';
                    statusClass = 'status-lost';
                    break;
                default:
                    status = transaction.status;
            }
            
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                </td>
                <td>${window.formatDate(transaction.borrowDate)}</td>
                <td>${transaction.returnDate ? window.formatDate(transaction.returnDate) : 'N/A'}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm view-book" data-id="${book._id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${transaction.status === 'returned' ? 
                        `<button class="btn btn-success btn-sm borrow-again" data-id="${book._id}">
                            <i class="fas fa-redo"></i> Borrow Again
                        </button>` : ''
                    }
                </td>
            `;
            
            // Add event listeners
            const viewBtn = tr.querySelector('.view-book');
            viewBtn.addEventListener('click', () => window.viewBook(book._id));
            
            const borrowAgainBtn = tr.querySelector('.borrow-again');
            if (borrowAgainBtn) {
                borrowAgainBtn.addEventListener('click', () => window.borrowBook(book._id));
            }
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        historyContainer.appendChild(table);
    }
    
    // Render pagination
    function renderPagination() {
        // Check if historyPaginationContainer exists
        if (!historyPaginationContainer) {
            // Try to create a pagination container if it doesn't exist
            if (historyContainer && historyContainer.parentNode) {
                // Create pagination container if it doesn't exist
                historyPaginationContainer = document.createElement('div');
                historyPaginationContainer.className = 'history-pagination';
                historyContainer.parentNode.appendChild(historyPaginationContainer);
                console.log('Created new history pagination container');
            } else {
                console.error('Cannot create pagination container - parent element not found');
                return;
            }
        }
        
        // Check if we need pagination
        if (totalPages <= 1) {
            historyPaginationContainer.innerHTML = '';
            return;
        }
        
        // Generate pagination HTML
        let paginationHTML = '<div class="pagination">';
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        paginationHTML += '</div>';
        
        // Update container
        historyPaginationContainer.innerHTML = paginationHTML;
        
        // Add event listeners to pagination buttons
        const paginationButtons = historyPaginationContainer.querySelectorAll('.pagination-btn');
        paginationButtons.forEach(button => {
            button.addEventListener('click', function() {
                currentPage = parseInt(this.getAttribute('data-page'));
                loadHistory();
            });
        });
    }
    
    // Public API
    return {
        init,
        loadHistory
    };
})();

// Module will be initialized by auth module after login

// Make module globally available
window.historyModule = historyModule;
