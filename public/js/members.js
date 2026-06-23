// Members management functionality
const membersModule = (() => {
    // DOM Elements
    let membersList = document.querySelector('#members-table tbody');
    let membersCount = document.getElementById('members-count');
    let memberSearchForm = document.getElementById('member-search-form');
    let pagination = document.getElementById('members-pagination');
    
    // State
    let currentPage = 1;
    let totalPages = 1;
    let searchParams = {};
    
    // Initialize module
    function init() {
        console.log('Initializing members module');
        
        // Add event listeners
        if (memberSearchForm) {
            memberSearchForm.addEventListener('submit', handleSearch);
        }
        
        // Load members
        loadMembers();
    }
    
    // Handle search form submission
    function handleSearch(e) {
        e.preventDefault();
        
        // Reset to first page
        currentPage = 1;
        
        // Get form data
        const name = document.getElementById('search-member-name')?.value.trim();
        const email = document.getElementById('search-member-email')?.value.trim();
        const status = document.getElementById('search-member-status')?.value;
        
        // Build search params
        searchParams = {};
        
        if (name) searchParams.name = name;
        if (email) searchParams.email = email;
        if (status && status !== 'all') searchParams.status = status;
        
        // Load members with search params
        loadMembers();
    }
    
    // Load members
    async function loadMembers() {
        try {
            if (!membersList) return;
            
            // Show loading state
            membersList.innerHTML = '<tr><td colspan="7" class="loading"><i class="fas fa-spinner fa-spin"></i> Loading members...</td></tr>';
            
            // Build query string
            let queryString = `page=${currentPage}`;
            
            // Add search params
            for (const [key, value] of Object.entries(searchParams)) {
                queryString += `&${key}=${encodeURIComponent(value)}`;
            }
            
            // Fetch members
            const data = await window.fetchAPI(`/members?${queryString}`);
            
            // Update state
            totalPages = data.totalPages;
            
            // Update pagination
            renderPagination();
            
            // Render members
            renderMembers(data.members);
            
            // Update counter
            if (membersCount) {
                membersCount.textContent = data.members.length;
            }
        } catch (error) {
            console.error('Error loading members:', error);
            if (membersList) {
                membersList.innerHTML = '<tr><td colspan="7" class="error">Error loading members. Please try again.</td></tr>';
            }
        }
    }
    
    // Render members list
    function renderMembers(members) {
        if (!membersList) return;
        
        // Clear existing list
        membersList.innerHTML = '';
        
        // Check if there are any members
        if (!members || members.length === 0) {
            membersList.innerHTML = '<tr><td colspan="7" class="empty-message">No members found</td></tr>';
            return;
        }
        
        // Render each member
        members.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.phone || 'N/A'}</td>
                <td>${window.formatDate(member.membershipDate)}</td>
                <td>${window.formatDate(member.membershipExpiry)}</td>
                <td><span class="status-badge ${member.status}">${member.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info view-member" data-id="${member._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary edit-member" data-id="${member._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-member" data-id="${member._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Add event listeners
            const viewBtn = row.querySelector('.view-member');
            const editBtn = row.querySelector('.edit-member');
            const deleteBtn = row.querySelector('.delete-member');
            
            if (viewBtn) viewBtn.addEventListener('click', () => viewMember(member._id));
            if (editBtn) editBtn.addEventListener('click', () => editMember(member._id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => deleteMember(member._id));
            
            membersList.appendChild(row);
        });
    }
    
    // Render pagination
    function renderPagination() {
        if (!pagination) return;
        
        // Clear existing pagination
        pagination.innerHTML = '';
        
        // Check if we need pagination
        if (totalPages <= 1) {
            return;
        }
        
        // Create pagination
        const container = document.createElement('div');
        container.className = 'pagination';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '&laquo;';
        if (currentPage > 1) {
            prevBtn.addEventListener('click', () => {
                currentPage--;
                loadMembers();
            });
        }
        container.appendChild(prevBtn);
        
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                loadMembers();
            });
            container.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '&raquo;';
        if (currentPage < totalPages) {
            nextBtn.addEventListener('click', () => {
                currentPage++;
                loadMembers();
            });
        }
        container.appendChild(nextBtn);
        
        pagination.appendChild(container);
    }
    
    // View member details
    async function viewMember(memberId) {
        try {
            // Fetch member details
            const member = await window.fetchAPI(`/members/${memberId}`);
            
            // Build modal content
            const modalContent = `
                <div class="member-details">
                    <h3>${member.name}</h3>
                    <p><strong>Email:</strong> ${member.email}</p>
                    <p><strong>Phone:</strong> ${member.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> ${member.address || 'N/A'}</p>
                    <p><strong>Role:</strong> <span class="badge badge-${window.getRoleBadgeColor(member.role)}">${member.role}</span></p>
                    <p><strong>Status:</strong> <span class="status-badge ${member.status}">${member.status}</span></p>
                    <p><strong>Membership Date:</strong> ${window.formatDate(member.membershipDate)}</p>
                    <p><strong>Membership Expiry:</strong> ${window.formatDate(member.membershipExpiry)}</p>
                </div>
            `;
            
            // Show modal
            window.showModal('Member Details', modalContent);
        } catch (error) {
            console.error('Error loading member details:', error);
            window.showToast('Failed to load member details', 'error');
        }
    }
    
    // Edit member
    async function editMember(memberId) {
        try {
            // Fetch member details
            const member = await window.fetchAPI(`/members/${memberId}`);
            
            // Build form
            const modalContent = `
                <form id="edit-member-form">
                    <div class="form-group">
                        <label for="edit-name">Name</label>
                        <input type="text" id="edit-name" name="name" value="${member.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-email">Email</label>
                        <input type="email" id="edit-email" name="email" value="${member.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-phone">Phone</label>
                        <input type="tel" id="edit-phone" name="phone" value="${member.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-address">Address</label>
                        <textarea id="edit-address" name="address">${member.address || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-status">Status</label>
                        <select id="edit-status" name="status" required>
                            <option value="active" ${member.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${member.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="suspended" ${member.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-expiry">Membership Expiry</label>
                        <input type="date" id="edit-expiry" name="membershipExpiry" value="${member.membershipExpiry ? new Date(member.membershipExpiry).toISOString().split('T')[0] : ''}">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            `;
            
            // Show modal
            window.showModal('Edit Member', modalContent);
            
            // Add form submit handler
            const form = document.getElementById('edit-member-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    // Get form data
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        // Update member
                        await window.fetchAPI(`/members/${memberId}`, {
                            method: 'PUT',
                            body: JSON.stringify(data)
                        });
                        
                        // Show success message
                        window.showToast('Member updated successfully', 'success');
                        
                        // Close modal
                        window.closeModal();
                        
                        // Reload members
                        loadMembers();
                    } catch (error) {
                        console.error('Error updating member:', error);
                        window.showToast('Failed to update member', 'error');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading member details for edit:', error);
            window.showToast('Failed to load member details', 'error');
        }
    }
    
    // Delete member
    async function deleteMember(memberId) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Delete member
            await window.fetchAPI(`/members/${memberId}`, {
                method: 'DELETE'
            });
            
            // Show success message
            window.showToast('Member deleted successfully', 'success');
            
            // Reload members
            loadMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
            window.showToast('Failed to delete member', 'error');
        }
    }
    
    // Add new member
    function showAddMemberForm() {
        // Build form
        const modalContent = `
            <form id="add-member-form">
                <div class="form-group">
                    <label for="add-name">Name</label>
                    <input type="text" id="add-name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="add-email">Email</label>
                    <input type="email" id="add-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="add-password">Password</label>
                    <input type="password" id="add-password" name="password" required>
                </div>
                <div class="form-group">
                    <label for="add-phone">Phone</label>
                    <input type="tel" id="add-phone" name="phone">
                </div>
                <div class="form-group">
                    <label for="add-address">Address</label>
                    <textarea id="add-address" name="address"></textarea>
                </div>
                <div class="form-group">
                    <label for="add-role">Role</label>
                    <select id="add-role" name="role" required>
                        <option value="member">Member</option>
                        <option value="librarian">Librarian</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="add-expiry">Membership Expiry</label>
                    <input type="date" id="add-expiry" name="membershipExpiry">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Member</button>
                </div>
            </form>
        `;
        
        // Show modal
        window.showModal('Add New Member', modalContent);
        
        // Add form submit handler
        const form = document.getElementById('add-member-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    // Add member
                    await window.fetchAPI('/members', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    // Show success message
                    window.showToast('Member added successfully', 'success');
                    
                    // Close modal
                    window.closeModal();
                    
                    // Reload members
                    loadMembers();
                } catch (error) {
                    console.error('Error adding member:', error);
                    window.showToast('Failed to add member', 'error');
                }
            });
        }
    }
    
    // Public API
    return {
        init,
        loadMembers,
        showAddMemberForm
    };
})();

// Make membersModule globally available
window.membersModule = membersModule;
