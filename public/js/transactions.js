// Transactions module for the Library Management System
const transactionsModule = (() => {
    // DOM elements
    const transactionsTable = document.getElementById('transactions-table');
    const transactionSearchForm = document.getElementById('transaction-search-form');
    const newTransactionBtn = document.getElementById('new-transaction-btn');
    const transactionsPagination = document.getElementById('transactions-pagination');
    
    // State
    let currentPage = 1;
    let searchParams = {};
    
    // Initialize
    function init() {
        // Add event listeners
        if (transactionSearchForm) {
            transactionSearchForm.addEventListener('submit', handleSearch);
            transactionSearchForm.addEventListener('reset', handleReset);
        }
        
        if (newTransactionBtn) {
            newTransactionBtn.addEventListener('click', showNewTransactionModal);
        }
        
        // Load transactions
        loadTransactions();
    }
    
    // Load transactions
    async function loadTransactions(page = 1, params = {}) {
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
            
            // Fetch transactions
            const data = await fetchAPI(`/transactions?${queryString}`);
            
            renderTransactions(data.transactions);
            renderPagination(data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }
    
    // Render transactions
    function renderTransactions(transactions) {
        const tableBody = transactionsTable.querySelector('tbody');
        
        tableBody.innerHTML = '';
        
        if (transactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="8" class="text-center">No transactions found</td>';
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
                <td>${formatDate(transaction.returnDate) || 'Not returned'}</td>
                <td><span class="badge badge-${getStatusBadgeColor(transaction.status)}">${transaction.status}</span></td>
                <td>${formatCurrency(transaction.fineAmount)}</td>
                <td class="table-actions">
                    <button class="btn btn-primary btn-sm view-transaction" data-id="${transaction._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${transaction.status === 'borrowed' ? `
                        <button class="btn btn-success btn-sm return-book" data-id="${transaction._id}">
                            <i class="fas fa-undo"></i> Return
                        </button>
                        <button class="btn btn-secondary btn-sm extend-due-date" data-id="${transaction._id}">
                            <i class="fas fa-calendar-plus"></i> Extend
                        </button>
                    ` : ''}
                </td>
            `;
            
            // Add event listeners
            const viewBtn = row.querySelector('.view-transaction');
            viewBtn.addEventListener('click', () => viewTransaction(transaction._id));
            
            const returnBtn = row.querySelector('.return-book');
            if (returnBtn) {
                returnBtn.addEventListener('click', () => returnBook(transaction._id));
            }
            
            const extendBtn = row.querySelector('.extend-due-date');
            if (extendBtn) {
                extendBtn.addEventListener('click', () => extendDueDate(transaction._id, transaction.dueDate));
            }
            
            tableBody.appendChild(row);
        });
    }
    
    // Render pagination
    function renderPagination(currentPage, totalPages) {
        if (!transactionsPagination) return;
        
        transactionsPagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = createPagination(currentPage, totalPages, (page) => {
            loadTransactions(page, searchParams);
        });
        
        transactionsPagination.appendChild(pagination);
    }
    
    // Handle search form submission
    function handleSearch(e) {
        e.preventDefault();
        
        const formData = new FormData(transactionSearchForm);
        const params = {};
        
        for (const [key, value] of formData.entries()) {
            if (value) {
                params[key] = value;
            }
        }
        
        loadTransactions(1, params);
    }
    
    // Handle search form reset
    function handleReset() {
        setTimeout(() => {
            loadTransactions(1, {});
        }, 0);
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
    
    // View transaction details
    async function viewTransaction(id) {
        try {
            const transaction = await fetchAPI(`/transactions/${id}`);
            
            const modalContent = `
                <div class="transaction-details">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Book</label>
                            <p>${transaction.bookId.title}</p>
                        </div>
                        <div class="form-group">
                            <label>Author</label>
                            <p>${transaction.bookId.author}</p>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>ISBN</label>
                            <p>${transaction.bookId.isbn}</p>
                        </div>
                        <div class="form-group">
                            <label>Member</label>
                            <p>${transaction.memberId.name}</p>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Borrow Date</label>
                            <p>${formatDate(transaction.borrowDate)}</p>
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <p>${formatDate(transaction.dueDate)}</p>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Return Date</label>
                            <p>${formatDate(transaction.returnDate) || 'Not returned'}</p>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <p><span class="badge badge-${getStatusBadgeColor(transaction.status)}">${transaction.status}</span></p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Fine Amount</label>
                        <p>${formatCurrency(transaction.fineAmount)}</p>
                    </div>
                </div>
            `;
            
            openModal('Transaction Details', modalContent);
        } catch (error) {
            console.error('Error viewing transaction:', error);
        }
    }
    
    // Show new transaction modal
    async function showNewTransactionModal() {
        try {
            // Fetch books and members for dropdown
            const [booksData, membersData] = await Promise.all([
                fetchAPI('/books?limit=100'),
                fetchAPI('/members?limit=100')
            ]);
            
            const books = booksData.books.filter(book => book.availableCopies > 0);
            const members = membersData.members.filter(member => member.status === 'active');
            
            if (books.length === 0) {
                showToast('No books available for borrowing', 'warning');
                return;
            }
            
            if (members.length === 0) {
                showToast('No active members found', 'warning');
                return;
            }
            
            const modalContent = `
                <form id="new-transaction-form">
                    <div class="form-group">
                        <label for="transaction-book">Book *</label>
                        <select id="transaction-book" name="bookId" required>
                            <option value="">Select a book</option>
                            ${books.map(book => `
                                <option value="${book._id}">${book.title} by ${book.author} (${book.availableCopies} available)</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transaction-member">Member *</label>
                        <select id="transaction-member" name="memberId" required>
                            <option value="">Select a member</option>
                            ${members.map(member => `
                                <option value="${member._id}">${member.name} (${member.email})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transaction-due-date">Due Date *</label>
                        <input type="date" id="transaction-due-date" name="dueDate" required>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">Issue Book</button>
                    </div>
                </form>
            `;
            
            openModal('Issue Book', modalContent);
            
            // Set default due date (14 days from today)
            const dueDateInput = document.getElementById('transaction-due-date');
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + 14);
            dueDateInput.valueAsDate = defaultDueDate;
            
            // Add event listener to form
            const newTransactionForm = document.getElementById('new-transaction-form');
            newTransactionForm.addEventListener('submit', handleNewTransaction);
        } catch (error) {
            console.error('Error showing new transaction modal:', error);
        }
    }
    
    // Handle new transaction form submission
    async function handleNewTransaction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transactionData = {};
        
        for (const [key, value] of formData.entries()) {
            transactionData[key] = value;
        }
        
        try {
            await fetchAPI('/transactions/borrow', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            closeModal();
            showToast('Book issued successfully', 'success');
            loadTransactions();
        } catch (error) {
            console.error('Error issuing book:', error);
        }
    }
    
    // Return book
    async function returnBook(id) {
        if (!confirm('Are you sure you want to return this book?')) {
            return;
        }
        
        try {
            await fetchAPI(`/transactions/${id}/return`, {
                method: 'PUT'
            });
            
            showToast('Book returned successfully', 'success');
            loadTransactions(currentPage, searchParams);
        } catch (error) {
            console.error('Error returning book:', error);
        }
    }
    
    // Extend due date
    function extendDueDate(id, currentDueDate) {
        const currentDate = new Date(currentDueDate);
        
        const modalContent = `
            <form id="extend-due-date-form">
                <input type="hidden" name="id" value="${id}">
                <div class="form-group">
                    <label for="new-due-date">New Due Date *</label>
                    <input type="date" id="new-due-date" name="newDueDate" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Extend Due Date</button>
                </div>
            </form>
        `;
        
        openModal('Extend Due Date', modalContent);
        
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Set default new due date (7 days from current due date)
        const defaultNewDueDate = new Date(currentDate);
        defaultNewDueDate.setDate(defaultNewDueDate.getDate() + 7);
        
        const newDueDateInput = document.getElementById('new-due-date');
        newDueDateInput.min = tomorrow.toISOString().split('T')[0];
        newDueDateInput.valueAsDate = defaultNewDueDate;
        
        // Add event listener to form
        const extendDueDateForm = document.getElementById('extend-due-date-form');
        extendDueDateForm.addEventListener('submit', handleExtendDueDate);
    }
    
    // Handle extend due date form submission
    async function handleExtendDueDate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const id = formData.get('id');
        const newDueDate = formData.get('newDueDate');
        
        try {
            await fetchAPI(`/transactions/${id}/extend`, {
                method: 'PUT',
                body: JSON.stringify({ newDueDate })
            });
            
            closeModal();
            showToast('Due date extended successfully', 'success');
            loadTransactions(currentPage, searchParams);
        } catch (error) {
            console.error('Error extending due date:', error);
        }
    }
    
    // Calculate fines for all overdue books
    async function calculateFines() {
        try {
            const result = await fetchAPI('/transactions/calculate-fines');
            
            showToast(`Fines calculated: ${result.finesCreated} new fines created, total amount: ${formatCurrency(result.totalFineAmount)}`, 'success');
            
            loadTransactions(currentPage, searchParams);
        } catch (error) {
            console.error('Error calculating fines:', error);
        }
    }
    
    // Public API
    return {
        init,
        loadTransactions,
        calculateFines
    };
})();

// Make transactionsModule globally available
window.transactionsModule = transactionsModule;
