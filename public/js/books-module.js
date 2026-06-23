// Books Module for Member Portal
// Handles borrowed books and book returns

const booksModule = (() => {
    // DOM Elements - using let instead of const to allow reassignment
    let borrowedBooksContainer = document.querySelector('.borrowed-books-list');
    let reservedBooksContainer = document.querySelector('.reserved-books-list');
    
    // Initialize module
    function init() {
        console.log('Initializing books module');
        
        // Try to get DOM elements if they're not already available
        if (!borrowedBooksContainer) {
            console.log('Borrowed books container not found, trying to get it again');
            borrowedBooksContainer = document.querySelector('.borrowed-books-list');
        }
        
        if (!reservedBooksContainer) {
            console.log('Reserved books container not found, trying to get it again');
            reservedBooksContainer = document.querySelector('.reserved-books-list');
        }
        
        // Check if DOM elements exist after trying to get them
        if (!borrowedBooksContainer) {
            console.error('Borrowed books container not found during initialization');
            return; // Exit early if the element still doesn't exist
        }
        
        console.log('Borrowed books container found');
        
        // Load borrowed books
        loadBorrowedBooks();
    }
    
    // Load borrowed books
    async function loadBorrowedBooks() {
        try {
            // Check if borrowedBooksContainer exists
            if (!borrowedBooksContainer) {
                console.log('Borrowed books container not found, trying to get it again');
                borrowedBooksContainer = document.querySelector('.borrowed-books-list');
                if (!borrowedBooksContainer) {
                    console.error('Borrowed books container element not found');
                    return; // Exit early if the element still doesn't exist
                }
            }

            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!user) {
                console.log('User not logged in, cannot load borrowed books');
                return;
            }
            
            // Show loading state
            borrowedBooksContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading borrowed books...</div>';
            
            // Fetch borrowed books
            console.log(`Fetching borrowed books for member ${user._id}`);
            const data = await window.fetchAPI(`/transactions/member/${user._id}?status=borrowed`);
            
            // Render borrowed books
            renderBorrowedBooks(data.transactions);
            
            // Load reserved books
            loadReservedBooks();
        } catch (error) {
            console.error('Error loading borrowed books:', error);
            if (borrowedBooksContainer) {
                borrowedBooksContainer.innerHTML = '<div class="error">Error loading borrowed books. Please try again.</div>';
            }
        }
    }
    
    // Render borrowed books
    function renderBorrowedBooks(transactions) {
        // Check if borrowedBooksContainer exists
        if (!borrowedBooksContainer) {
            console.log('Borrowed books container not found in renderBorrowedBooks, trying to get it again');
            borrowedBooksContainer = document.querySelector('.borrowed-books-list');
            if (!borrowedBooksContainer) {
                console.error('Borrowed books container element not found in renderBorrowedBooks');
                return; // Exit early if the element still doesn't exist
            }
        }
        
        // Clear container
        borrowedBooksContainer.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            borrowedBooksContainer.innerHTML = '<div class="empty-message">You have no borrowed books.</div>';
            return;
        }
        
        // Create book items
        transactions.forEach(transaction => {
            const book = transaction.bookId;
            const dueDate = new Date(transaction.dueDate);
            const today = new Date();
            
            // Calculate days remaining
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            let dueDateClass = '';
            let daysText = '';
            
            if (daysRemaining < 0) {
                dueDateClass = 'overdue';
                daysText = `${Math.abs(daysRemaining)} days overdue`;
            } else if (daysRemaining <= 3) {
                dueDateClass = 'soon';
                daysText = daysRemaining === 0 ? 'Due today' : `Due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
            } else {
                daysText = `Due in ${daysRemaining} days`;
            }
            
            const bookItem = document.createElement('div');
            bookItem.className = 'book-item';
            
            bookItem.innerHTML = `
                <div class="book-cover">
                    <img src="https://via.placeholder.com/80x120?text=${encodeURIComponent(book.title)}" alt="${book.title}">
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>Author: ${book.author}</p>
                    <p>Borrowed on: ${window.formatDate(transaction.borrowDate)}</p>
                    <p class="due-date ${dueDateClass}">Due on: ${window.formatDate(transaction.dueDate)} (${daysText})</p>
                    <div class="book-actions">
                        <button class="btn btn-primary btn-sm view-book" data-id="${book._id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn btn-success btn-sm return-book" data-id="${transaction._id}">
                            <i class="fas fa-undo"></i> Return Book
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            const viewBtn = bookItem.querySelector('.view-book');
            viewBtn.addEventListener('click', () => window.viewBook(book._id));
            
            const returnBtn = bookItem.querySelector('.return-book');
            returnBtn.addEventListener('click', () => returnBook(transaction._id));
            
            borrowedBooksContainer.appendChild(bookItem);
        });
    }
    
    // Load reserved books
    async function loadReservedBooks() {
        try {
            // Check if reservedBooksContainer exists
            if (!reservedBooksContainer) {
                console.log('Reserved books container not found, trying to get it again');
                reservedBooksContainer = document.querySelector('.reserved-books-list');
                if (!reservedBooksContainer) {
                    console.error('Reserved books container element not found');
                    return; // Exit early if the element still doesn't exist
                }
            }

            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!user) {
                console.log('User not logged in, cannot load reserved books');
                return;
            }
            
            // Show loading state
            reservedBooksContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading reserved books...</div>';
            
            // Fetch reserved books
            console.log(`Fetching reserved books for member ${user._id}`);
            const data = await window.fetchAPI(`/transactions/member/${user._id}?status=reserved`);
            
            // Render reserved books
            renderReservedBooks(data.transactions);
        } catch (error) {
            console.error('Error loading reserved books:', error);
            if (reservedBooksContainer) {
                reservedBooksContainer.innerHTML = '<div class="error">Error loading reserved books. Please try again.</div>';
            }
        }
    }
    
    // Render reserved books
    function renderReservedBooks(transactions) {
        // Check if reservedBooksContainer exists
        if (!reservedBooksContainer) {
            console.log('Reserved books container not found in renderReservedBooks, trying to get it again');
            reservedBooksContainer = document.querySelector('.reserved-books-list');
            if (!reservedBooksContainer) {
                console.error('Reserved books container element not found in renderReservedBooks');
                return; // Exit early if the element still doesn't exist
            }
        }
        
        // Clear container
        reservedBooksContainer.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            reservedBooksContainer.innerHTML = '<div class="empty-message">You have no reserved books.</div>';
            return;
        }
        
        // Create book items
        transactions.forEach(transaction => {
            const book = transaction.bookId;
            
            const bookItem = document.createElement('div');
            bookItem.className = 'book-item';
            
            bookItem.innerHTML = `
                <div class="book-cover">
                    <img src="https://via.placeholder.com/80x120?text=${encodeURIComponent(book.title)}" alt="${book.title}">
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>Author: ${book.author}</p>
                    <p>Reserved on: ${window.formatDate(transaction.reservationDate)}</p>
                    <div class="book-actions">
                        <button class="btn btn-primary btn-sm view-book" data-id="${book._id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn btn-danger btn-sm cancel-reservation" data-id="${transaction._id}">
                            <i class="fas fa-times"></i> Cancel Reservation
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            const viewBtn = bookItem.querySelector('.view-book');
            viewBtn.addEventListener('click', () => window.viewBook(book._id));
            
            const cancelBtn = bookItem.querySelector('.cancel-reservation');
            cancelBtn.addEventListener('click', () => cancelReservation(transaction._id));
            
            reservedBooksContainer.appendChild(bookItem);
        });
    }
    
    // Return book
    async function returnBook(transactionId) {
        try {
            // Confirm return
            if (!confirm('Are you sure you want to return this book?')) {
                return;
            }
            
            console.log(`Returning book with transaction ID: ${transactionId}`);
            
            // Return book - use the member endpoint now
            await window.fetchAPI(`/transactions/member/${transactionId}/return`, {
                method: 'PUT'
            });
            
            // Show success message
            window.showToast('Book returned successfully', 'success');
            
            // Reload borrowed books
            loadBorrowedBooks();
            
            // Refresh home data
            if (window.loadHomeData) {
                window.loadHomeData();
            }
        } catch (error) {
            console.error('Error returning book:', error);
            window.showToast(error.message, 'error');
        }
    }
    
    // Cancel reservation
    async function cancelReservation(transactionId) {
        try {
            // Confirm cancellation
            if (!confirm('Are you sure you want to cancel this reservation?')) {
                return;
            }
            
            console.log(`Cancelling reservation with transaction ID: ${transactionId}`);
            
            // Cancel reservation - use the member endpoint now
            await window.fetchAPI(`/transactions/member/${transactionId}/cancel`, {
                method: 'PUT'
            });
            
            // Show success message
            window.showToast('Reservation cancelled successfully', 'success');
            
            // Reload reserved books
            loadReservedBooks();
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            window.showToast(error.message, 'error');
        }
    }
    
    // Public API
    return {
        init,
        loadBorrowedBooks
    };
})();

// Module will be initialized by auth module after login

// Make module globally available
window.booksModule = booksModule;
