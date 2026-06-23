// Main JavaScript file for the Member Portal

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

// API helper functions
const API_URL = '/api';

// Fetch API wrapper with authentication
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    // If no token is available and this is not a login/register request,
    // return empty data to prevent unnecessary API calls before login
    if (!token && !endpoint.includes('/auth/')) {
        console.log('API call skipped - user not logged in:', endpoint);
        return { skipped: true };
    }
    
    // Make sure the endpoint starts with a slash
    if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
    }
    
    // Log the full URL being called to help with debugging
    console.log('Making API call to:', `${API_URL}${endpoint}`);
    
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
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        // Only show toast for errors when user is logged in
        if (token) {
            showToast(error.message, 'error');
        }
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

// Book modal functionality
const bookModal = document.getElementById('book-modal');
const modalTitle = document.getElementById('modal-title');
const bookDetails = document.getElementById('book-details');
const closeBtn = document.querySelector('.close');

// Close modal when clicking the close button
if (closeBtn) {
    closeBtn.addEventListener('click', closeBookModal);
}

// Close modal when clicking outside the modal content
window.addEventListener('click', (e) => {
    if (e.target === bookModal) {
        closeBookModal();
    }
});

// Open book modal
function openBookModal(book) {
    modalTitle.textContent = book.title;
    
    // Create book details content
    const content = `
        <div class="book-details">
            <div class="book-details-cover">
                <img src="https://via.placeholder.com/200x300?text=${encodeURIComponent(book.title)}" alt="${book.title}">
            </div>
            <div class="book-details-info">
                <p><span class="label">Author:</span> ${book.author}</p>
                <p><span class="label">ISBN:</span> ${book.isbn}</p>
                <p><span class="label">Genre:</span> ${book.genre}</p>
                <p><span class="label">Publisher:</span> ${book.publisher}</p>
                <p><span class="label">Publication Year:</span> ${book.publicationYear}</p>
                <p><span class="label">Available Copies:</span> ${book.availableCopies} / ${book.totalCopies}</p>
                <p><span class="label">Shelf Location:</span> ${book.shelfLocation || 'N/A'}</p>
                <p><span class="label">Description:</span> ${book.description || 'No description available'}</p>
                
                <div class="book-details-actions">
                    ${book.availableCopies > 0 ? 
                        `<button class="btn btn-primary borrow-book-btn" data-id="${book._id}">
                            <i class="fas fa-bookmark"></i> Borrow Book
                        </button>` : 
                        `<button class="btn btn-secondary" disabled>
                            <i class="fas fa-times-circle"></i> Not Available
                        </button>`
                    }
                </div>
            </div>
        </div>
    `;
    
    bookDetails.innerHTML = content;
    
    // Add event listener to borrow button
    const borrowBtn = bookDetails.querySelector('.borrow-book-btn');
    if (borrowBtn) {
        borrowBtn.addEventListener('click', () => borrowBook(book._id));
    }
    
    bookModal.style.display = 'block';
}

// Close book modal
function closeBookModal() {
    bookModal.style.display = 'none';
}

// Make modal functions globally available
window.openBookModal = openBookModal;
window.closeBookModal = closeBookModal;

// User dropdown functionality
const userDropdownBtn = document.getElementById('user-dropdown-btn');
const dropdownContent = document.querySelector('.dropdown-content');

if (userDropdownBtn) {
    userDropdownBtn.addEventListener('click', () => {
        dropdownContent.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userDropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.classList.add('hidden');
        }
    });
}

// Tab navigation
const navTabs = document.querySelectorAll('.nav-tabs li');
const tabContents = document.querySelectorAll('.tab-content');

navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show selected tab content
        const tabName = tab.getAttribute('data-tab');
        tabContents.forEach(content => {
            if (content.id === tabName) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
        
        // Refresh tab data
        refreshTabData(tabName);
    });
});

// Sub-tab navigation
const tabBtns = document.querySelectorAll('.tab-btn');
const subTabContents = document.querySelectorAll('.sub-tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Get parent tab
        const parentTab = btn.closest('.tab-content');
        
        // Update active button
        parentTab.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show selected sub-tab content
        const targetId = btn.getAttribute('data-target');
        parentTab.querySelectorAll('.sub-tab-content').forEach(content => {
            if (content.id === targetId) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    });
});

// Global search functionality
const globalSearch = document.getElementById('global-search');
const searchBtn = document.getElementById('search-btn');

if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = globalSearch.value.trim();
        if (query) {
            // Show catalog tab
            navTabs.forEach(tab => {
                if (tab.getAttribute('data-tab') === 'catalog-tab') {
                    tab.click();
                }
            });
            
            // Set search field and submit form
            document.getElementById('search-title').value = query;
            document.getElementById('book-search-form').dispatchEvent(new Event('submit'));
        }
    });
}

if (globalSearch) {
    globalSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

// Refresh tab data
function refreshTabData(tabName) {
    // Add a small delay to ensure the DOM is ready after tab switch
    setTimeout(() => {
        switch (tabName) {
            case 'home-tab':
                loadHomeData();
                break;
            case 'catalog-tab':
                // Make sure catalog module is initialized
                if (window.catalogModule) {
                    // Reinitialize if needed
                    if (window.catalogModule.init) window.catalogModule.init();
                    // Then load books
                    window.catalogModule.loadBooks();
                }
                break;
            case 'borrowed-tab':
                if (window.booksModule) window.booksModule.loadBorrowedBooks();
                break;
            case 'history-tab':
                if (window.historyModule) window.historyModule.loadHistory();
                break;
            case 'fines-tab':
                if (window.finesModule) window.finesModule.loadFines();
                break;
        }
    }, 50); // Small delay to ensure DOM is ready
}

// Load home data
async function loadHomeData() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user) return;
        
        // Update welcome message
        document.getElementById('welcome-name').textContent = user.name;
        
        // Fetch borrowed books
        const transactions = await fetchAPI(`/transactions/member/${user._id}?status=borrowed`);
        
        // Update stats
        document.getElementById('books-borrowed-count').textContent = transactions.transactions.length;
        
        // Count books due soon (within 3 days)
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);
        
        let dueSoonCount = 0;
        transactions.transactions.forEach(transaction => {
            const dueDate = new Date(transaction.dueDate);
            if (dueDate <= threeDaysLater && dueDate >= today) {
                dueSoonCount++;
            }
        });
        
        document.getElementById('due-soon-count').textContent = dueSoonCount;
        
        // Fetch fines
        const fines = await fetchAPI(`/fines/member/${user._id}?paymentStatus=pending`);
        
        // Calculate total pending fines
        let totalPendingFines = 0;
        fines.fines.forEach(fine => {
            totalPendingFines += fine.amount;
        });
        
        document.getElementById('pending-fines').textContent = formatCurrency(totalPendingFines);
        
        // Load current books
        loadCurrentBooks(transactions.transactions);
        
        // Load due dates
        loadDueDates(transactions.transactions);
        
        // Load recommended books
        loadRecommendedBooks();
    } catch (error) {
        console.error('Error loading home data:', error);
    }
}

// Load current books
function loadCurrentBooks(transactions) {
    const currentBooks = document.getElementById('current-books');
    const emptyMessage = currentBooks.querySelector('.empty-message');
    
    if (transactions.length === 0) {
        emptyMessage.classList.remove('hidden');
        return;
    }
    
    emptyMessage.classList.add('hidden');
    
    // Clear previous content
    currentBooks.innerHTML = '';
    currentBooks.appendChild(emptyMessage);
    
    // Add book items
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
                <p>Due Date: ${formatDate(transaction.dueDate)}</p>
                <div class="book-actions">
                    <button class="btn btn-primary btn-sm view-book" data-id="${book._id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener to view button
        const viewBtn = bookItem.querySelector('.view-book');
        viewBtn.addEventListener('click', () => viewBook(book._id));
        
        currentBooks.appendChild(bookItem);
    });
}

// Load due dates
function loadDueDates(transactions) {
    const dueDates = document.getElementById('due-dates');
    const emptyMessage = dueDates.querySelector('.empty-message');
    
    if (transactions.length === 0) {
        emptyMessage.classList.remove('hidden');
        return;
    }
    
    emptyMessage.classList.add('hidden');
    
    // Clear previous content
    dueDates.innerHTML = '';
    dueDates.appendChild(emptyMessage);
    
    // Sort transactions by due date
    transactions.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Add due items
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
        
        const dueItem = document.createElement('div');
        dueItem.className = 'due-item';
        
        dueItem.innerHTML = `
            <div class="due-info">
                <h4>${book.title}</h4>
                <p>${book.author}</p>
            </div>
            <div class="due-date ${dueDateClass}">
                <p>${formatDate(transaction.dueDate)}</p>
                <p>${daysText}</p>
            </div>
        `;
        
        dueDates.appendChild(dueItem);
    });
}

// Load recommended books
async function loadRecommendedBooks() {
    try {
        // Fetch all books
        const data = await fetchAPI('/books?limit=6');
        
        const recommendedBooks = document.getElementById('recommended-books');
        
        // Clear previous content
        recommendedBooks.innerHTML = '';
        
        // Add book cards
        data.books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            
            bookCard.innerHTML = `
                <div class="book-card-cover">
                    <img src="https://via.placeholder.com/200x250?text=${encodeURIComponent(book.title)}" alt="${book.title}">
                </div>
                <div class="book-card-info">
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                </div>
                <div class="book-card-actions">
                    <button class="btn btn-primary btn-sm view-book" data-id="${book._id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${book.availableCopies > 0 ? 
                        `<button class="btn btn-success btn-sm borrow-book" data-id="${book._id}">
                            <i class="fas fa-bookmark"></i> Borrow
                        </button>` : 
                        `<button class="btn btn-secondary btn-sm" disabled>
                            <i class="fas fa-times-circle"></i> Unavailable
                        </button>`
                    }
                </div>
            `;
            
            // Add event listeners
            const viewBtn = bookCard.querySelector('.view-book');
            viewBtn.addEventListener('click', () => viewBook(book._id));
            
            const borrowBtn = bookCard.querySelector('.borrow-book');
            if (borrowBtn) {
                borrowBtn.addEventListener('click', () => borrowBook(book._id));
            }
            
            recommendedBooks.appendChild(bookCard);
        });
    } catch (error) {
        console.error('Error loading recommended books:', error);
    }
}

// View book details
async function viewBook(id) {
    try {
        const book = await fetchAPI(`/books/${id}`);
        openBookModal(book);
    } catch (error) {
        console.error('Error viewing book:', error);
    }
}

// Borrow book
async function borrowBook(bookId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user) {
            showToast('You must be logged in to borrow books', 'error');
            return;
        }
        
        // Set due date (14 days from today)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        
        // Create transaction using the member-specific endpoint
        await fetchAPI('/transactions/member/borrow', {
            method: 'POST',
            body: JSON.stringify({
                bookId,
                dueDate: dueDate.toISOString()
                // No need to send memberId, it's taken from the authenticated user
            })
        });
        
        showToast('Book borrowed successfully', 'success');
        closeBookModal();
        
        // Refresh home data
        loadHomeData();
        
        // Refresh borrowed books if on that tab
        if (document.getElementById('borrowed-tab') && !document.getElementById('borrowed-tab').classList.contains('hidden')) {
            if (window.booksModule) window.booksModule.loadBorrowedBooks();
        }
        
        // Refresh catalog to update available copies only if on catalog tab
        if (document.getElementById('catalog-tab') && !document.getElementById('catalog-tab').classList.contains('hidden')) {
            if (window.catalogModule) window.catalogModule.loadBooks();
        }
    } catch (error) {
        console.error('Error borrowing book:', error);
        showToast('Failed to borrow book. Please try again.', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth module first
    if (window.authModule) {
        window.authModule.init();
    }
    
    // Other modules will be initialized after login in the auth module
});
