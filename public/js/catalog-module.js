// Catalog Module for Member Portal

const catalogModule = (() => {
    // DOM Elements - using 'let' instead of 'const' to allow reassignment
    let bookSearchForm = document.getElementById('book-search-form');
    let booksContainer = document.getElementById('book-grid'); // Fixed ID to match HTML
    let paginationContainer = document.getElementById('catalog-pagination');
    
    // State
    let currentPage = 1;
    let totalPages = 1;
    let searchParams = {};
    
    // Initialize module
    function init() {
        console.log('Initializing catalog module');
        
        // Try to get DOM elements if they're not already available
        if (!booksContainer) {
            booksContainer = document.getElementById('book-grid'); // Using correct ID that matches HTML
        }
        
        if (!bookSearchForm) {
            bookSearchForm = document.getElementById('book-search-form');
        }
        
        if (!paginationContainer) {
            paginationContainer = document.getElementById('catalog-pagination');
        }
        
        // Check if DOM elements exist after trying to get them
        if (!booksContainer) {
            console.error('Books container not found during initialization');
            return;
        }
        
        console.log('Books container found:', booksContainer.id);
        
        // Add event listeners
        if (bookSearchForm) {
            // First remove any existing event listeners by cloning and replacing
            // We'll use a different approach to avoid reassignment issues
            bookSearchForm.removeEventListener('submit', handleSearch);
            
            // Add the event listener
            bookSearchForm.addEventListener('submit', handleSearch);
            console.log('Search form event listener added');
        }
        
        // Load initial books
        loadBooks();
    }
    
    // Handle search form submission
    function handleSearch(e) {
        e.preventDefault();
        
        // Reset to first page
        currentPage = 1;
        
        // Get form data
        const title = document.getElementById('search-title').value.trim();
        const author = document.getElementById('search-author').value.trim();
        const genre = document.getElementById('search-genre').value;
        const isbn = document.getElementById('search-isbn').value.trim();
        
        // Get additional search parameters if they exist
        const yearFrom = document.getElementById('search-year-from')?.value.trim();
        const yearTo = document.getElementById('search-year-to')?.value.trim();
        const availability = document.getElementById('search-available')?.value;
        
        // Build search params
        searchParams = {};
        
        if (title) searchParams.title = title;
        if (author) searchParams.author = author;
        if (genre && genre !== 'all' && genre !== '') searchParams.genre = genre;
        if (isbn) searchParams.isbn = isbn;
        if (yearFrom) searchParams.yearFrom = yearFrom;
        if (yearTo) searchParams.yearTo = yearTo;
        if (availability) searchParams.available = availability;
        
        console.log('Search parameters:', searchParams);
        
        // Set a flag to indicate we're performing a search
        searchParams.isSearch = true;
        
        // Load books with search params
        loadBooks();
    }
    
    // Load books
    async function loadBooks() {
        try {
            // Check if booksContainer exists
            if (!booksContainer) {
                console.log('Books container not found, trying to get it again');
                const booksContainerElement = document.getElementById('book-grid'); // Using correct ID
                if (!booksContainerElement) {
                    console.error('Books container element not found');
                    return; // Exit early if the element still doesn't exist
                }
                // Update the reference
                booksContainer = booksContainerElement;
            }
            
            // Show loading state
            booksContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading books...</div>';
            
            // Build query string - Increase limit to show more books
            let queryString = `page=${currentPage}&limit=24`; // Doubled the limit to show more books
            
            let endpoint = '/books';
            
            // Check if we're doing a search 
            const isSearch = searchParams.isSearch;
            delete searchParams.isSearch; // Remove the flag from params so it doesn't get sent to API
            
            // Default endpoint for regular book listing
            endpoint = '/books';
            
            // If this is explicitly marked as a search, use the search endpoint
            if (isSearch) {
                endpoint = '/books/search';
                console.log('Using search endpoint: /books/search');
            }
            
            // Add search params to query string
            for (const [key, value] of Object.entries(searchParams)) {
                queryString += `&${key}=${encodeURIComponent(value)}`;
            }
            
            console.log('Fetching with params:', searchParams);
            
            // Fetch books
            console.log('Fetching books from:', `${endpoint}?${queryString}`);
            const data = await window.fetchAPI(`${endpoint}?${queryString}`);
            
            // Update pagination
            totalPages = Math.ceil(data.total / data.limit);
            console.log(`Found ${data.total} books, showing page ${currentPage} of ${totalPages}`);
            
            // Render books
            renderBooks(data.books);
            
            // Render pagination
            renderPagination();
        } catch (error) {
            console.error('Error loading books:', error);
            if (booksContainer) {
                booksContainer.innerHTML = '<div class="error">Error loading books. Please try again.</div>';
            }
        }
    }
    
    // Render books
    function renderBooks(books) {
        // Check if booksContainer exists
        if (!booksContainer) {
            console.log('Books container not found in renderBooks, trying to get it again');
            const booksContainerElement = document.getElementById('book-grid'); // Using correct ID
            if (!booksContainerElement) {
                console.error('Books container element not found in renderBooks');
                return; // Exit early if the element still doesn't exist
            }
            // Update the reference
            booksContainer = booksContainerElement;
        }
        
        // Clear container
        booksContainer.innerHTML = '';
        
        if (books.length === 0) {
            booksContainer.innerHTML = '<div class="empty-message">No books found matching your search criteria.</div>';
            return;
        }
        
        // Create book cards
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            
            bookCard.innerHTML = `
                <div class="book-card-cover">
                    <img src="https://via.placeholder.com/200x250?text=${encodeURIComponent(book.title)}" alt="${book.title}">
                </div>
                <div class="book-card-info">
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                    <p class="book-genre">${book.genre}</p>
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
            viewBtn.addEventListener('click', () => window.viewBook(book._id));
            
            const borrowBtn = bookCard.querySelector('.borrow-book');
            if (borrowBtn) {
                borrowBtn.addEventListener('click', () => window.borrowBook(book._id));
            }
            
            booksContainer.appendChild(bookCard);
        });
    }
    
    // Render pagination
    function renderPagination() {
        // Try to get the pagination container if it's not available
        if (!paginationContainer) {
            console.log('Pagination container not found, trying to get it again');
            const paginationElement = document.getElementById('catalog-pagination');
            if (!paginationElement) {
                console.error('Pagination container element not found');
                return; // Exit early if the element still doesn't exist
            }
            // Update the reference
            paginationContainer = paginationElement;
        }
        
        // Clear container
        paginationContainer.innerHTML = '';
        
        // Create pagination controls
        if (totalPages > 1) {
            const pagination = window.createPagination(currentPage, totalPages, (page) => {
                currentPage = page;
                loadBooks();
            });
            
            paginationContainer.appendChild(pagination);
        }
    }
    
    // Load genres for search dropdown
    async function loadGenres() {
        try {
            const genreSelect = document.getElementById('search-genre');
            
            if (!genreSelect) {
                console.log('Genre select element not found, will try again later');
                return;
            }
            
            // Fetch all books to get unique genres
            const data = await window.fetchAPI('/books?limit=100');
            
            // Check if data is valid
            if (!data || !data.books || data.skipped) {
                console.log('No book data available for genres');
                return;
            }
            
            // Extract unique genres
            const genres = [...new Set(data.books.map(book => book.genre))].sort();
            
            // Add options
            genreSelect.innerHTML = '<option value="all">All Genres</option>';
            
            genres.forEach(genre => {
                if (genre) { // Only add non-empty genres
                    const option = document.createElement('option');
                    option.value = genre;
                    option.textContent = genre;
                    genreSelect.appendChild(option);
                }
            });
            
            console.log('Genres loaded successfully:', genres.length);
        } catch (error) {
            console.error('Error loading genres:', error);
        }
    }
    
    // Public API
    return {
        init,
        loadBooks,
        loadGenres
    };
})();

// Module will be initialized by auth module after login

// Make module globally available
window.catalogModule = catalogModule;
