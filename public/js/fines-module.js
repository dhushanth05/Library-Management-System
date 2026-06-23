// Fines Module for Member Portal
// Handles fines management

const finesModule = (() => {
    // DOM Elements - using let instead of const to allow reassignment
    let pendingFinesContainer = document.querySelector('#pending-fines .fines-list');
    let paidFinesContainer = document.querySelector('#paid-fines .fines-list');
    let waivedFinesContainer = document.querySelector('#waived-fines .fines-list');
    let totalPendingFinesElement = document.getElementById('total-pending-fines');
    
    // Initialize module
    function init() {
        console.log('Initializing fines module');
        
        // Try to get DOM elements if they're not already available
        if (!pendingFinesContainer) {
            console.log('Pending fines container not found, trying to get it again');
            pendingFinesContainer = document.querySelector('#pending-fines .fines-list');
        }
        
        if (!paidFinesContainer) {
            console.log('Paid fines container not found, trying to get it again');
            paidFinesContainer = document.querySelector('#paid-fines .fines-list');
        }
        
        if (!waivedFinesContainer) {
            console.log('Waived fines container not found, trying to get it again');
            waivedFinesContainer = document.querySelector('#waived-fines .fines-list');
        }
        
        if (!totalPendingFinesElement) {
            console.log('Total pending fines element not found, trying to get it again');
            totalPendingFinesElement = document.getElementById('total-pending-fines');
        }
        
        // Check if essential DOM elements exist after trying to get them
        if (!pendingFinesContainer) {
            console.error('Pending fines container not found during initialization');
            return; // Exit early if essential elements still don't exist
        }
        
        console.log('Fines containers found, loading fines');
        
        // Load fines
        loadFines();
    }
    
    // Load all fines
    async function loadFines() {
        try {
            console.log('Loading all fines');
            
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!user) {
                console.log('User not logged in, cannot load fines');
                return;
            }
            
            // Load pending fines
            loadPendingFines(user._id);
            
            // Load paid fines
            loadPaidFines(user._id);
            
            // Load waived fines
            loadWaivedFines(user._id);
        } catch (error) {
            console.error('Error loading fines:', error);
            window.showToast('error', 'Failed to load fines. Please try again.');
        }
    }
    
    // Load pending fines
    async function loadPendingFines(memberId) {
        try {
            // Check if pendingFinesContainer exists
            if (!pendingFinesContainer) {
                console.log('Pending fines container not found, trying to get it again');
                pendingFinesContainer = document.querySelector('#pending-fines .fines-list');
                if (!pendingFinesContainer) {
                    console.error('Pending fines container element not found');
                    return; // Exit early if the element still doesn't exist
                }
            }
            
            // Show loading state
            pendingFinesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading pending fines...</div>';
            
            console.log(`Fetching pending fines for member ${memberId}`);
            // Fetch pending fines
            const data = await window.fetchAPI(`/fines/member/${memberId}?paymentStatus=pending`);
            
            // Update total pending fines display
            updateTotalPendingFines(data.fines);
            
            // Render pending fines
            renderPendingFines(data.fines);
        } catch (error) {
            console.error('Error loading pending fines:', error);
            if (pendingFinesContainer) {
                pendingFinesContainer.innerHTML = '<div class="error">Error loading pending fines. Please try again.</div>';
            }
        }
    }
    
    // Update total pending fines amount
    function updateTotalPendingFines(fines) {
        if (!totalPendingFinesElement) {
            console.log('Total pending fines element not found, trying to get it again');
            totalPendingFinesElement = document.getElementById('total-pending-fines');
            if (!totalPendingFinesElement) {
                console.error('Total pending fines element not found');
                return;
            }
        }
        
        // Calculate total pending amount
        const totalAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);
        
        // Format and display
        totalPendingFinesElement.textContent = `₹${totalAmount.toFixed(2)}`;
    }
    
    // Render pending fines
    function renderPendingFines(fines) {
        // Check if pendingFinesContainer exists
        if (!pendingFinesContainer) {
            console.log('Pending fines container not found in renderPendingFines, trying to get it again');
            pendingFinesContainer = document.querySelector('#pending-fines .fines-list');
            if (!pendingFinesContainer) {
                console.error('Pending fines container element not found in renderPendingFines');
                return; // Exit early if the element still doesn't exist
            }
        }
        
        // Clear container
        pendingFinesContainer.innerHTML = '';
        
        if (!fines || fines.length === 0) {
            pendingFinesContainer.innerHTML = '<div class="empty-message">No pending fines.</div>';
            return;
        }
        
        // Calculate total
        let totalAmount = 0;
        fines.forEach(fine => {
            totalAmount += fine.amount;
        });
        
        // Create fines table
        const table = document.createElement('table');
        table.className = 'fines-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Book</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        fines.forEach(fine => {
            const book = fine.transactionId.bookId;
            
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                </td>
                <td>${fine.reason}</td>
                <td>${window.formatDate(fine.createdAt)}</td>
                <td>${window.formatCurrency(fine.amount)}</td>
                <td>
                    <button class="btn btn-primary btn-sm pay-fine" data-id="${fine._id}">
                        <i class="fas fa-credit-card"></i> Pay
                    </button>
                </td>
            `;
            
            // Add event listeners
            const payBtn = tr.querySelector('.pay-fine');
            payBtn.addEventListener('click', () => payFine(fine._id));
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // Create total row
        const totalDiv = document.createElement('div');
        totalDiv.className = 'fines-total';
        totalDiv.innerHTML = `
            <span>Total Pending:</span>
            <span class="total-amount">${window.formatCurrency(totalAmount)}</span>
            <button class="btn btn-primary pay-all-fines">
                <i class="fas fa-credit-card"></i> Pay All
            </button>
        `;
        
        // Add event listener to pay all button
        const payAllBtn = totalDiv.querySelector('.pay-all-fines');
        payAllBtn.addEventListener('click', () => payAllFines(fines.map(fine => fine._id)));
        
        // Append to container
        pendingFinesContainer.appendChild(table);
        pendingFinesContainer.appendChild(totalDiv);
    }
    
    // Load paid fines
    async function loadPaidFines(memberId) {
        try {
            // Check if paidFinesContainer exists
            if (!paidFinesContainer) {
                console.log('Paid fines container not found, trying to get it again');
                paidFinesContainer = document.querySelector('#paid-fines .fines-list');
                if (!paidFinesContainer) {
                    console.error('Paid fines container element not found');
                    return; // Exit early if the element still doesn't exist
                }
            }
            
            // Show loading state
            paidFinesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading paid fines...</div>';
            
            console.log(`Fetching paid fines for member ${memberId}`);
            // Fetch paid fines
            const data = await window.fetchAPI(`/fines/member/${memberId}?paymentStatus=paid`);
            
            // Render paid fines
            renderPaidFines(data.fines);
        } catch (error) {
            console.error('Error loading paid fines:', error);
            if (paidFinesContainer) {
                paidFinesContainer.innerHTML = '<div class="error">Error loading paid fines. Please try again.</div>';
            }
        }
    }
    
    // Render paid fines
    function renderPaidFines(fines) {
        // Check if paidFinesContainer exists
        if (!paidFinesContainer) {
            console.log('Paid fines container not found in renderPaidFines, trying to get it again');
            paidFinesContainer = document.querySelector('#paid-fines .fines-list');
            if (!paidFinesContainer) {
                console.error('Paid fines container element not found in renderPaidFines');
                return; // Exit early if the element still doesn't exist
            }
        }
        
        // Clear container
        paidFinesContainer.innerHTML = '';
        
        if (!fines || fines.length === 0) {
            paidFinesContainer.innerHTML = '<div class="empty-message">No paid fines.</div>';
            return;
        }
        
        // Calculate total
        let totalAmount = 0;
        fines.forEach(fine => {
            totalAmount += fine.amount;
        });
        
        // Create fines table
        const table = document.createElement('table');
        table.className = 'fines-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Book</th>
                <th>Reason</th>
                <th>Fine Date</th>
                <th>Payment Date</th>
                <th>Amount</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        fines.forEach(fine => {
            const book = fine.transactionId.bookId;
            
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                </td>
                <td>${fine.reason}</td>
                <td>${window.formatDate(fine.createdAt)}</td>
                <td>${window.formatDate(fine.paymentDate)}</td>
                <td>${window.formatCurrency(fine.amount)}</td>
            `;
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // Create total row
        const totalDiv = document.createElement('div');
        totalDiv.className = 'fines-total';
        totalDiv.innerHTML = `
            <span>Total Paid:</span>
            <span class="total-amount">${window.formatCurrency(totalAmount)}</span>
        `;
        
        // Append to container
        paidFinesContainer.appendChild(table);
        paidFinesContainer.appendChild(totalDiv);
    }
    
    // Load waived fines
    async function loadWaivedFines(memberId) {
        try {
            // Check if waivedFinesContainer exists
            if (!waivedFinesContainer) {
                console.log('Waived fines container not found, trying to get it again');
                waivedFinesContainer = document.querySelector('#waived-fines .fines-list');
                if (!waivedFinesContainer) {
                    console.error('Waived fines container element not found');
                    return; // Exit early if the element still doesn't exist
                }
            }
            
            // Show loading state
            waivedFinesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading waived fines...</div>';
            
            console.log(`Fetching waived fines for member ${memberId}`);
            // Fetch waived fines
            const data = await window.fetchAPI(`/fines/member/${memberId}?paymentStatus=waived`);
            
            // Render waived fines
            renderWaivedFines(data.fines);
        } catch (error) {
            console.error('Error loading waived fines:', error);
            if (waivedFinesContainer) {
                waivedFinesContainer.innerHTML = '<div class="error">Error loading waived fines. Please try again.</div>';
            }
        }
    }
    
    // Render waived fines
    function renderWaivedFines(fines) {
        // Check if waivedFinesContainer exists
        if (!waivedFinesContainer) {
            console.log('Waived fines container not found in renderWaivedFines, trying to get it again');
            waivedFinesContainer = document.querySelector('#waived-fines .fines-list');
            if (!waivedFinesContainer) {
                console.error('Waived fines container element not found in renderWaivedFines');
                return; // Exit early if the element still doesn't exist
            }
        }
        
        // Clear container
        waivedFinesContainer.innerHTML = '';
        
        if (!fines || fines.length === 0) {
            waivedFinesContainer.innerHTML = '<div class="empty-message">No waived fines.</div>';
            return;
        }
        
        // Calculate total
        let totalAmount = 0;
        fines.forEach(fine => {
            totalAmount += fine.amount;
        });
        
        // Create fines table
        const table = document.createElement('table');
        table.className = 'fines-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Book</th>
                <th>Reason</th>
                <th>Fine Date</th>
                <th>Waived Date</th>
                <th>Amount</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        fines.forEach(fine => {
            const book = fine.transactionId.bookId;
            
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author}</div>
                </td>
                <td>${fine.reason}</td>
                <td>${window.formatDate(fine.createdAt)}</td>
                <td>${window.formatDate(fine.waivedDate)}</td>
                <td>${window.formatCurrency(fine.amount)}</td>
            `;
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // Create total row
        const totalDiv = document.createElement('div');
        totalDiv.className = 'fines-total';
        totalDiv.innerHTML = `
            <span>Total Waived:</span>
            <span class="total-amount">${window.formatCurrency(totalAmount)}</span>
        `;
        
        // Append to container
        waivedFinesContainer.appendChild(table);
        waivedFinesContainer.appendChild(totalDiv);
    }
    
    // Pay a single fine
    async function payFine(fineId) {
        try {
            // Confirm payment
            if (!confirm('Are you sure you want to pay this fine?')) {
                return;
            }
            
            // Pay fine
            await window.fetchAPI(`/fines/${fineId}/pay`, {
                method: 'PUT'
            });
            
            // Show success message
            window.showToast('Fine paid successfully', 'success');
            
            // Reload fines
            loadFines();
            
            // Refresh home data
            if (window.loadHomeData) {
                window.loadHomeData();
            }
        } catch (error) {
            console.error('Error paying fine:', error);
            window.showToast(error.message, 'error');
        }
    }
    
    // Pay all fines
    async function payAllFines(fineIds) {
        try {
            // Confirm payment
            if (!confirm('Are you sure you want to pay all pending fines?')) {
                return;
            }
            
            // Pay all fines
            await window.fetchAPI('/fines/pay-multiple', {
                method: 'PUT',
                body: JSON.stringify({ fineIds })
            });
            
            // Show success message
            window.showToast('All fines paid successfully', 'success');
            
            // Reload fines
            loadFines();
            
            // Refresh home data
            if (window.loadHomeData) {
                window.loadHomeData();
            }
        } catch (error) {
            console.error('Error paying all fines:', error);
            window.showToast(error.message, 'error');
        }
    }
    
    // Public API
    return {
        init,
        loadFines
    };
})();

// Module will be initialized by auth module after login

// Make module globally available
window.finesModule = finesModule;
