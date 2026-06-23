// Reports functionality
const reportsModule = (() => {
    // DOM Elements
    let borrowingTrendsChart = null;
    let popularBooksChart = null;
    let memberActivityChart = null;
    let revenueChart = null;
    
    let reportDateRange = document.getElementById('report-date-range');
    
    // Initialize module
    function init() {
        console.log('Initializing reports module');
        
        // Add event listeners
        if (reportDateRange) {
            reportDateRange.addEventListener('change', generateReports);
        }
        
        // Load initial reports
        generateReports();
    }
    
    // Generate all reports
    async function generateReports() {
        try {
            // Get selected date range
            const dateRange = reportDateRange ? reportDateRange.value : '30days';
            
            // Load reports data
            const data = await window.fetchAPI(`/reports?range=${dateRange}`);
            
            // Generate individual reports
            generateBorrowingTrendsChart(data.borrowingTrends);
            generatePopularBooksChart(data.popularBooks);
            generateMemberActivityChart(data.memberActivity);
            generateRevenueChart(data.revenue);
        } catch (error) {
            console.error('Error generating reports:', error);
            window.showToast('Failed to generate reports', 'error');
        }
    }
    
    // Generate borrowing trends chart
    function generateBorrowingTrendsChart(data) {
        const ctx = document.getElementById('borrowing-trends-chart');
        if (!ctx) return;
        
        // If chart already exists, destroy it
        if (borrowingTrendsChart) {
            borrowingTrendsChart.destroy();
        }
        
        // Create new chart
        borrowingTrendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.date),
                datasets: [{
                    label: 'Books Borrowed',
                    data: data.map(item => item.count),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Borrowing Trends'
                    }
                }
            }
        });
    }
    
    // Generate popular books chart
    function generatePopularBooksChart(data) {
        const ctx = document.getElementById('popular-books-chart');
        if (!ctx) return;
        
        // If chart already exists, destroy it
        if (popularBooksChart) {
            popularBooksChart.destroy();
        }
        
        // Create new chart
        popularBooksChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.title),
                datasets: [{
                    label: 'Number of Borrows',
                    data: data.map(item => item.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Most Popular Books'
                    }
                }
            }
        });
    }
    
    // Generate member activity chart
    function generateMemberActivityChart(data) {
        const ctx = document.getElementById('member-activity-chart');
        if (!ctx) return;
        
        // If chart already exists, destroy it
        if (memberActivityChart) {
            memberActivityChart.destroy();
        }
        
        // Create new chart
        memberActivityChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(item => item.category),
                datasets: [{
                    data: data.map(item => item.count),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Member Activity'
                    }
                }
            }
        });
    }
    
    // Generate revenue chart
    function generateRevenueChart(data) {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;
        
        // If chart already exists, destroy it
        if (revenueChart) {
            revenueChart.destroy();
        }
        
        // Create new chart
        revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.month),
                datasets: [{
                    label: 'Revenue (₹)',
                    data: data.map(item => item.amount),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Monthly Revenue'
                    }
                }
            }
        });
    }
    
    // Export data to CSV
    function exportToCsv(reportType) {
        // Get report data
        let data = [];
        let filename = '';
        
        switch (reportType) {
            case 'borrowing':
                // Export borrowing trends
                data = borrowingTrendsChart.data.labels.map((date, i) => ({
                    Date: date,
                    Count: borrowingTrendsChart.data.datasets[0].data[i]
                }));
                filename = 'borrowing-trends.csv';
                break;
            case 'popular':
                // Export popular books
                data = popularBooksChart.data.labels.map((title, i) => ({
                    Title: title,
                    Borrows: popularBooksChart.data.datasets[0].data[i]
                }));
                filename = 'popular-books.csv';
                break;
            case 'activity':
                // Export member activity
                data = memberActivityChart.data.labels.map((category, i) => ({
                    Category: category,
                    Count: memberActivityChart.data.datasets[0].data[i]
                }));
                filename = 'member-activity.csv';
                break;
            case 'revenue':
                // Export revenue
                data = revenueChart.data.labels.map((month, i) => ({
                    Month: month,
                    Revenue: revenueChart.data.datasets[0].data[i]
                }));
                filename = 'revenue.csv';
                break;
            default:
                window.showToast('Invalid report type', 'error');
                return;
        }
        
        // Convert to CSV
        const headers = Object.keys(data[0]);
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            });
            csv += values.join(',') + '\n';
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Public API
    return {
        init,
        generateReports,
        exportToCsv
    };
})();

// Make reportsModule globally available
window.reportsModule = reportsModule;
