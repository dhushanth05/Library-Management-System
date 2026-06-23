// Fines module for the Library Management System
const finesModule = (() => {
    // DOM elements
    const finesTable = document.getElementById('fines-table');
    const fineSearchForm = document.getElementById('fine-search-form');
    const calculateFinesBtn = document.getElementById('calculate-fines-btn');
    const finesPagination = document.getElementById('fines-pagination');
    
    // Fine statistics elements
    const totalFinesAmount = document.getElementById('total-fines-amount');
    const pendingFinesAmount = document.getElementById('pending-fines-amount');
    const paidFinesAmount = document.getElementById('paid-fines-amount');
    const waivedFinesAmount = document.getElementById('waived-fines-amount');
    
    // State
    let currentPage = 1;
    let searchParams = {};
    
    // Initialize
    function init() {
        // Add event listeners
        if (fineSearchForm) {
            fineSearchForm.addEventListener('submit', handleSearch);
            fineSearchForm.addEventListener('reset', handleReset);
        }
        
        if (calculateFinesBtn) {
            calculateFinesBtn.addEventListener('click', calculateFines);
        }
        
        // Load fines
        loadFines();
        
        // Load fine statistics
        loadFineStatistics();
    }
    
    // Load fines
    async function loadFines(page = 1, params = {}) {
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
            
            // Fetch fines
            const data = await fetchAPI(`/fines?${queryString}`);
            
            renderFines(data.fines);
            renderPagination(data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error loading fines:', error);
        }
    }
    
    // Load fine statistics
    async function loadFineStatistics() {
        try {
            const stats = await fetchAPI('/fines/stats/summary');
            
            if (totalFinesAmount) totalFinesAmount.textContent = formatCurrency(stats.total.amount);
            if (pendingFinesAmount) pendingFinesAmount.textContent = formatCurrency(stats.pending.amount);
            if (paidFinesAmount) paidFinesAmount.textContent = formatCurrency(stats.paid.amount);
            if (waivedFinesAmount) waivedFinesAmount.textContent = formatCurrency(stats.waived.amount);
        } catch (error) {
            console.error('Error loading fine statistics:', error);
        }
    }
    
    // Render fines
    function renderFines(fines) {
        const tableBody = finesTable.querySelector('tbody');
        
        tableBody.innerHTML = '';
        
        if (fines.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" class="text-center">No fines found</td>';
            tableBody.appendChild(row);
            return;
        }
        
        fines.forEach(fine => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${fine.memberId.name}</td>
                <td>${fine.transactionId.bookId.title}</td>
                <td>${fine.reason}</td>
                <td>${formatCurrency(fine.amount)}</td>
                <td>${formatDate(fine.dateIssued)}</td>
                <td><span class="badge badge-${getStatusBadgeColor(fine.paymentStatus)}">${fine.paymentStatus}</span></td>
                <td class="table-actions">
                    <button class="btn btn-primary btn-sm view-fine" data-id="${fine._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${fine.paymentStatus === 'pending' ? `
                        <button class="btn btn-success btn-sm pay-fine" data-id="${fine._id}">
                            <i class="fas fa-money-bill-wave"></i> Pay
                        </button>
                        <button class="btn btn-secondary btn-sm waive-fine" data-id="${fine._id}">
                            <i class="fas fa-ban"></i> Waive
                        </button>
                    ` : ''}
                </td>
            `;
            
            // Add event listeners
            const viewBtn = row.querySelector('.view-fine');
            viewBtn.addEventListener('click', () => viewFine(fine._id));
            
            const payBtn = row.querySelector('.pay-fine');
            if (payBtn) {
                payBtn.addEventListener('click', () => payFine(fine._id));
            }
            
            const waiveBtn = row.querySelector('.waive-fine');
            if (waiveBtn) {
                waiveBtn.addEventListener('click', () => waiveFine(fine._id));
            }
            
            tableBody.appendChild(row);
        });
    }
    
    // Render pagination
    function renderPagination(currentPage, totalPages) {
        if (!finesPagination) return;
        
        finesPagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = createPagination(currentPage, totalPages, (page) => {
            loadFines(page, searchParams);
        });
        
        finesPagination.appendChild(pagination);
    }
    
    // Handle search form submission
    function handleSearch(e) {
        e.preventDefault();
        
        const formData = new FormData(fineSearchForm);
        const params = {};
        
        for (const [key, value] of formData.entries()) {
            if (value) {
                params[key] = value;
            }
        }
        
        loadFines(1, params);
    }
    
    // Handle search form reset
    function handleReset() {
        setTimeout(() => {
            loadFines(1, {});
        }, 0);
    }
    
    // Get status badge color
    function getStatusBadgeColor(status) {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'paid':
                return 'success';
            case 'waived':
                return 'secondary';
            default:
                return 'primary';
        }
    }
    
    // View fine details
    async function viewFine(id) {
        try {
            const fine = await fetchAPI(`/fines/${id}`);
            
            const modalContent = `
                <div class="fine-details">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Member</label>
                            <p>${fine.memberId.name}</p>
                        </div>
                        <div class="form-group">
                            <label>Book</label>
                            <p>${fine.transactionId.bookId.title}</p>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Borrow Date</label>
                            <p>${formatDate(fine.transactionId.borrowDate)}</p>
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <p>${formatDate(fine.transactionId.dueDate)}</p>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Return Date</label>
                            <p>${formatDate(fine.transactionId.returnDate) || 'Not returned'}</p>
                        </div>
                        <div class="form-group">
                            <label>Fine Amount</label>
                            <p>${formatCurrency(fine.amount)}</p>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Reason</label>
                            <p>${fine.reason}</p>
                        </div>
                        <div class="form-group">
                            <label>Date Issued</label>
                            <p>${formatDate(fine.dateIssued)}</p>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Status</label>
                            <p><span class="badge badge-${getStatusBadgeColor(fine.paymentStatus)}">${fine.paymentStatus}</span></p>
                        </div>
                        <div class="form-group">
                            <label>Payment Date</label>
                            <p>${formatDate(fine.paymentDate) || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            `;
            
            openModal('Fine Details', modalContent);
        } catch (error) {
            console.error('Error viewing fine:', error);
        }
    }
    
    // Pay fine
    async function payFine(id) {
        if (!confirm('Are you sure you want to mark this fine as paid?')) {
            return;
        }
        
        try {
            await fetchAPI(`/fines/${id}/pay`, {
                method: 'PUT'
            });
            
            showToast('Fine marked as paid successfully', 'success');
            loadFines(currentPage, searchParams);
            loadFineStatistics();
        } catch (error) {
            console.error('Error paying fine:', error);
        }
    }
    
    // Waive fine
    async function waiveFine(id) {
        if (!confirm('Are you sure you want to waive this fine?')) {
            return;
        }
        
        try {
            await fetchAPI(`/fines/${id}/waive`, {
                method: 'PUT'
            });
            
            showToast('Fine waived successfully', 'success');
            loadFines(currentPage, searchParams);
            loadFineStatistics();
        } catch (error) {
            console.error('Error waiving fine:', error);
        }
    }
    
    // Calculate fines
    async function calculateFines() {
        try {
            const result = await fetchAPI('/transactions/calculate-fines');
            
            showToast(`Fines calculated: ${result.finesCreated} new fines created, total amount: ${formatCurrency(result.totalFineAmount)}`, 'success');
            
            loadFines(currentPage, searchParams);
            loadFineStatistics();
        } catch (error) {
            console.error('Error calculating fines:', error);
        }
    }
    
    // Public API
    return {
        init,
        loadFines,
        loadFineStatistics
    };
})();

// Make finesModule globally available
window.finesModule = finesModule;
