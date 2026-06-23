// Settings functionality
const settingsModule = (() => {
    // DOM Elements
    let systemSettingsForm = document.getElementById('system-settings-form');
    let emailSettingsForm = document.getElementById('email-settings-form');
    let fineSettingsForm = document.getElementById('fine-settings-form');
    
    // Initialize module
    function init() {
        console.log('Initializing settings module');
        
        // Add event listeners
        if (systemSettingsForm) {
            systemSettingsForm.addEventListener('submit', saveSystemSettings);
        }
        
        if (emailSettingsForm) {
            emailSettingsForm.addEventListener('submit', saveEmailSettings);
        }
        
        if (fineSettingsForm) {
            fineSettingsForm.addEventListener('submit', saveFineSettings);
        }
        
        // Load settings
        loadSettings();
    }
    
    // Load settings
    async function loadSettings() {
        try {
            // Fetch settings
            const settings = await window.fetchAPI('/settings');
            
            // Update system settings form
            if (systemSettingsForm) {
                const libraryName = systemSettingsForm.querySelector('[name="libraryName"]');
                const contactEmail = systemSettingsForm.querySelector('[name="contactEmail"]');
                const contactPhone = systemSettingsForm.querySelector('[name="contactPhone"]');
                const address = systemSettingsForm.querySelector('[name="address"]');
                const maxBooksPerMember = systemSettingsForm.querySelector('[name="maxBooksPerMember"]');
                const maxDaysBorrow = systemSettingsForm.querySelector('[name="maxDaysBorrow"]');
                
                if (libraryName) libraryName.value = settings.libraryName || '';
                if (contactEmail) contactEmail.value = settings.contactEmail || '';
                if (contactPhone) contactPhone.value = settings.contactPhone || '';
                if (address) address.value = settings.address || '';
                if (maxBooksPerMember) maxBooksPerMember.value = settings.maxBooksPerMember || 5;
                if (maxDaysBorrow) maxDaysBorrow.value = settings.maxDaysBorrow || 14;
            }
            
            // Update email settings form
            if (emailSettingsForm) {
                const smtpHost = emailSettingsForm.querySelector('[name="smtpHost"]');
                const smtpPort = emailSettingsForm.querySelector('[name="smtpPort"]');
                const smtpUser = emailSettingsForm.querySelector('[name="smtpUser"]');
                const smtpPass = emailSettingsForm.querySelector('[name="smtpPass"]');
                const fromEmail = emailSettingsForm.querySelector('[name="fromEmail"]');
                
                if (smtpHost) smtpHost.value = settings.smtpHost || '';
                if (smtpPort) smtpPort.value = settings.smtpPort || 587;
                if (smtpUser) smtpUser.value = settings.smtpUser || '';
                if (smtpPass) smtpPass.value = settings.smtpPass ? '********' : '';
                if (fromEmail) fromEmail.value = settings.fromEmail || '';
            }
            
            // Update fine settings form
            if (fineSettingsForm) {
                const overduePerDay = fineSettingsForm.querySelector('[name="overduePerDay"]');
                const damageFine = fineSettingsForm.querySelector('[name="damageFine"]');
                const lostBookFine = fineSettingsForm.querySelector('[name="lostBookFine"]');
                
                if (overduePerDay) overduePerDay.value = settings.overduePerDay || 0.50;
                if (damageFine) damageFine.value = settings.damageFine || 20;
                if (lostBookFine) lostBookFine.value = settings.lostBookFine || 100;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            window.showToast('Failed to load settings', 'error');
        }
    }
    
    // Save system settings
    async function saveSystemSettings(e) {
        e.preventDefault();
        
        try {
            // Get form data
            const formData = new FormData(systemSettingsForm);
            const data = Object.fromEntries(formData.entries());
            
            // Validate data
            if (!data.libraryName) {
                window.showToast('Library name is required', 'error');
                return;
            }
            
            if (!data.contactEmail || !isValidEmail(data.contactEmail)) {
                window.showToast('Valid contact email is required', 'error');
                return;
            }
            
            // Convert numeric values
            data.maxBooksPerMember = parseInt(data.maxBooksPerMember);
            data.maxDaysBorrow = parseInt(data.maxDaysBorrow);
            
            // Save settings
            await window.fetchAPI('/settings/system', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            // Show success message
            window.showToast('System settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving system settings:', error);
            window.showToast('Failed to save system settings', 'error');
        }
    }
    
    // Save email settings
    async function saveEmailSettings(e) {
        e.preventDefault();
        
        try {
            // Get form data
            const formData = new FormData(emailSettingsForm);
            const data = Object.fromEntries(formData.entries());
            
            // Validate data
            if (!data.smtpHost) {
                window.showToast('SMTP host is required', 'error');
                return;
            }
            
            if (!data.smtpPort) {
                window.showToast('SMTP port is required', 'error');
                return;
            }
            
            if (!data.fromEmail || !isValidEmail(data.fromEmail)) {
                window.showToast('Valid from email is required', 'error');
                return;
            }
            
            // Convert numeric values
            data.smtpPort = parseInt(data.smtpPort);
            
            // Don't update password if unchanged
            if (data.smtpPass === '********') {
                delete data.smtpPass;
            }
            
            // Save settings
            await window.fetchAPI('/settings/email', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            // Show success message
            window.showToast('Email settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving email settings:', error);
            window.showToast('Failed to save email settings', 'error');
        }
    }
    
    // Save fine settings
    async function saveFineSettings(e) {
        e.preventDefault();
        
        try {
            // Get form data
            const formData = new FormData(fineSettingsForm);
            const data = Object.fromEntries(formData.entries());
            
            // Convert numeric values
            data.overduePerDay = parseFloat(data.overduePerDay);
            data.damageFine = parseFloat(data.damageFine);
            data.lostBookFine = parseFloat(data.lostBookFine);
            
            // Save settings
            await window.fetchAPI('/settings/fines', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            // Show success message
            window.showToast('Fine settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving fine settings:', error);
            window.showToast('Failed to save fine settings', 'error');
        }
    }
    
    // Helper function to validate email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Public API
    return {
        init,
        loadSettings
    };
})();

// Make settingsModule globally available
window.settingsModule = settingsModule;
