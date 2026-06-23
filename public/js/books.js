// Books module for the Library Management System
const booksModule = (() => {
    // DOM elements
    const booksTable = document.getElementById('books-table');
    const bookSearchForm = document.getElementById('book-search-form');
    const addBookBtn = document.getElementById('add-book-btn');
    const booksPagination = document.getElementById('books-pagination');
    
    // State
    let currentPage = 1;
    let searchParams = {};
    
    // Initialize
    function init() {
        // Add event listeners
        if (bookSearchForm) {
            bookSearchForm.addEventListener('submit', handleSearch);
            bookSearchForm.addEventListener('reset', handleReset);
        }
        
        if (addBookBtn) {
            addBookBtn.addEventListener('click', showAddBookModal);
        }
        
        // Load books
        loadBooks();
    }
    
    // Load books
    async function loadBooks(page = 1, params = {}) {
        try {
            currentPage = page;
            searchParams = params;
            
            // Build query string
            let queryString = `page=${page}`;
            for (const [key, value] of Object.entries(params)) {
                if (value) {
                    queryString += `&${key}=${encodeURIComponent(value)}`;
                }
            }
            
            // Fetch books
            const endpoint = params.title || params.author || params.isbn || 
                             params.genre || params.publisher || params.yearFrom || 
                             params.yearTo || params.available || params.query
                           ? `/books/search?${queryString}`
                           : `/books?${queryString}`;
            
            const data = await fetchAPI(endpoint);
            
            renderBooks(data.books);
            renderPagination(data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error loading books:', error);
        }
    }
    
    // Render books
    function renderBooks(books) {
        const tableBody = booksTable.querySelector('tbody');
        
        tableBody.innerHTML = '';
        
        if (books.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" class="text-center">No books found</td>';
            tableBody.appendChild(row);
            return;
        }
        
        books.forEach(book => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td>${book.genre}</td>
                <td>${book.publicationYear}</td>
                <td>${book.availableCopies} / ${book.totalCopies}</td>
                <td class="table-actions">
                    <button class="btn btn-primary btn-sm view-book" data-id="${book._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm edit-book" data-id="${book._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-book" data-id="${book._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add event listeners
            const viewBtn = row.querySelector('.view-book');
            const editBtn = row.querySelector('.edit-book');
            const deleteBtn = row.querySelector('.delete-book');
            
            viewBtn.addEventListener('click', () => viewBook(book._id));
            editBtn.addEventListener('click', () => editBook(book._id));
            deleteBtn.addEventListener('click', () => deleteBook(book._id));
            
            tableBody.appendChild(row);
        });
    }
    
    // Render pagination
    function renderPagination(currentPage, totalPages) {
        if (!booksPagination) return;
        
        booksPagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = createPagination(currentPage, totalPages, (page) => {
            loadBooks(page, searchParams);
        });
        
        booksPagination.appendChild(pagination);
    }
    
    // Handle search form submission
    function handleSearch(e) {
        e.preventDefault();
        
        const formData = new FormData(bookSearchForm);
        const params = {};
        
        for (const [key, value] of formData.entries()) {
            if (value) {
                params[key] = value;
            }
        }
        
        loadBooks(1, params);
    }
    
    // Handle search form reset
    function handleReset() {
        setTimeout(() => {
            loadBooks(1, {});
        }, 0);
    }
    
    // View book details
    async function viewBook(id) {
        try {
            const book = await fetchAPI(`/books/${id}`);
            
            const modalContent = `
                <div class="book-details">
                    <div class="form-group">
                        <label>Title</label>
                        <p>${book.title}</p>
                    </div>
                    <div class="form-group">
                        <label>Author</label>
                        <p>${book.author}</p>
                    </div>
                    <div class="form-group">
                        <label>ISBN</label>
                        <p>${book.isbn}</p>
                    </div>
                    <div class="form-group">
                        <label>Genre</label>
                        <p>${book.genre}</p>
                    </div>
                    <div class="form-group">
                        <label>Publisher</label>
                        <p>${book.publisher}</p>
                    </div>
                    <div class="form-group">
                        <label>Publication Year</label>
                        <p>${book.publicationYear}</p>
                    </div>
                    <div class="form-group">
                        <label>Available Copies</label>
                        <p>${book.availableCopies} / ${book.totalCopies}</p>
                    </div>
                    <div class="form-group">
                        <label>Shelf Location</label>
                        <p>${book.shelfLocation || 'N/A'}</p>
                    </div>
                    <div class="form-group">
                        <label>Added Date</label>
                        <p>${formatDate(book.addedDate)}</p>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <p>${book.description || 'No description available'}</p>
                    </div>
                </div>
            `;
            
            openModal('Book Details', modalContent);
        } catch (error) {
            console.error('Error viewing book:', error);
        }
    }
    
    // Show add book modal
    function showAddBookModal() {
        const modalContent = `
            <form id="add-book-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="book-title">Title *</label>
                        <input type="text" id="book-title" name="title" required>
                    </div>
                    <div class="form-group">
                        <label for="book-author">Author *</label>
                        <input type="text" id="book-author" name="author" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="book-isbn">ISBN *</label>
                        <input type="text" id="book-isbn" name="isbn" required>
                    </div>
                    <div class="form-group">
                        <label for="book-publication-year">Publication Year *</label>
                        <input type="number" id="book-publication-year" name="publicationYear" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="book-publisher">Publisher *</label>
                        <input type="text" id="book-publisher" name="publisher" required>
                    </div>
                    <div class="form-group">
                        <label for="book-genre">Genre *</label>
                        <input type="text" id="book-genre" name="genre" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="book-total-copies">Total Copies *</label>
                        <input type="number" id="book-total-copies" name="totalCopies" min="1" value="1" required>
                    </div>
                    <div class="form-group">
                        <label for="book-shelf-location">Shelf Location</label>
                        <input type="text" id="book-shelf-location" name="shelfLocation">
                    </div>
                </div>
                <div class="form-group">
                    <label for="book-description">Description</label>
                    <textarea id="book-description" name="description"></textarea>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Add Book</button>
                </div>
            </form>
        `;
        
        openModal('Add New Book', modalContent);
        
        // Add event listener to form
        const addBookForm = document.getElementById('add-book-form');
        addBookForm.addEventListener('submit', handleAddBook);
    }
    
    // Handle add book form submission
    async function handleAddBook(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bookData = {};
        
        for (const [key, value] of formData.entries()) {
            bookData[key] = value;
        }
        
        try {
            await fetchAPI('/books', {
                method: 'POST',
                body: JSON.stringify(bookData)
            });
            
            closeModal();
            showToast('Book added successfully', 'success');
            loadBooks();
        } catch (error) {
            console.error('Error adding book:', error);
        }
    }
    
    // Edit book
    async function editBook(id) {
        try {
            const book = await fetchAPI(`/books/${id}`);
            
            const modalContent = `
                <form id="edit-book-form">
                    <input type="hidden" name="id" value="${book._id}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-title">Title *</label>
                            <input type="text" id="edit-book-title" name="title" value="${book.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-book-author">Author *</label>
                            <input type="text" id="edit-book-author" name="author" value="${book.author}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-isbn">ISBN *</label>
                            <input type="text" id="edit-book-isbn" name="isbn" value="${book.isbn}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-book-publication-year">Publication Year *</label>
                            <input type="number" id="edit-book-publication-year" name="publicationYear" value="${book.publicationYear}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-publisher">Publisher *</label>
                            <input type="text" id="edit-book-publisher" name="publisher" value="${book.publisher}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-book-genre">Genre *</label>
                            <input type="text" id="edit-book-genre" name="genre" value="${book.genre}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-book-total-copies">Total Copies *</label>
                            <input type="number" id="edit-book-total-copies" name="totalCopies" min="1" value="${book.totalCopies}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-book-shelf-location">Shelf Location</label>
                            <input type="text" id="edit-book-shelf-location" name="shelfLocation" value="${book.shelfLocation || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-book-description">Description</label>
                        <textarea id="edit-book-description" name="description">${book.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">Update Book</button>
                    </div>
                </form>
            `;
            
            openModal('Edit Book', modalContent);
            
            // Add event listener to form
            const editBookForm = document.getElementById('edit-book-form');
            editBookForm.addEventListener('submit', handleEditBook);
        } catch (error) {
            console.error('Error editing book:', error);
        }
    }
    
    // Handle edit book form submission
    async function handleEditBook(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const bookData = {};
        
        for (const [key, value] of formData.entries()) {
            if (key !== 'id') {
                bookData[key] = value;
            }
        }
        
        const id = formData.get('id');
        
        try {
            await fetchAPI(`/books/${id}`, {
                method: 'PUT',
                body: JSON.stringify(bookData)
            });
            
            closeModal();
            showToast('Book updated successfully', 'success');
            loadBooks(currentPage, searchParams);
        } catch (error) {
            console.error('Error updating book:', error);
        }
    }
    
    // Delete book
    async function deleteBook(id) {
        if (!confirm('Are you sure you want to delete this book?')) {
            return;
        }
        
        try {
            await fetchAPI(`/books/${id}`, {
                method: 'DELETE'
            });
            
            showToast('Book deleted successfully', 'success');
            loadBooks(currentPage, searchParams);
        } catch (error) {
            console.error('Error deleting book:', error);
        }
    }
    
    // Public API
    return {
        init,
        loadBooks
    };
})();

// Make booksModule globally available
window.booksModule = booksModule;
