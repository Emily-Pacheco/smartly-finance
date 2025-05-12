document.addEventListener('DOMContentLoaded', function() {
    console.log('Overview page loaded');
    const monthCards = document.querySelectorAll('.month-card');
    
    //Fetch transactions data
    fetchMonthlySummary();
    
    async function fetchMonthlySummary() {
        try {
            //Try to get monthly summary from API first
            const response = await fetch('/api/transactions');
            
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            
            const data = await response.json();
            console.log('Transactions data:', data);
            
            if (data.transactions && Array.isArray(data.transactions)) {
                calculateMonthlySummary(data.transactions);
            } else {
                throw new Error('Invalid transactions data format');
            }
            
        } catch (error) {
            console.error('Error fetching transactions:', error);
            
            //Fallback
            try {
                const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
                console.log('Using transactions from localStorage:', localTransactions);
                
                if (localTransactions.length > 0) {
                    calculateMonthlySummary(localTransactions);
                } else {
                    console.warn('No transactions found in localStorage');
                    setEmptyValues();
                }
            } catch (e) {
                console.error('Error using localStorage:', e);
                setEmptyValues();
            }
        }
    }
    
    function calculateMonthlySummary(transactions) {
        // Initialize monthly totals
        const monthlyTotals = {
            'January': { totalIn: 0, totalOut: 0  },
            'February': { totalIn: 0, totalOut: 0  },
            'March': { totalIn: 0, totalOut: 0},
            'April': { totalIn: 0, totalOut: 0},
            'May': { totalIn: 0, totalOut: 0},
            'June': { totalIn: 0, totalOut: 0 },
            'July': { totalIn: 0, totalOut: 0 },
            'August': { totalIn: 0, totalOut: 0  },
            'September': { totalIn: 0, totalOut:  0},
            'October': { totalIn: 0, totalOut: 0},
            'November': { totalIn: 0, totalOut: 0},
            'December': { totalIn: 0, totalOut: 0}
        };
        
        //Process each transaction
        transactions.forEach(transaction => {
            // Get transaction amount
            let amount = parseFloat(transaction.Amount || transaction.amount || 0);
            
            // Get transaction date
            const dateStr = transaction.Date || transaction.date;
            if (!dateStr) {
                console.warn('Transaction missing date:', transaction);
                return;
            }
            
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    console.error('Invalid date:', dateStr);
                    return;
                }
                
                // Get the month names
                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];
                const monthName = monthNames[date.getMonth()];
                
                // Update monthly totals
                if (amount >= 0) {
                    //Income (positive amount)
                    monthlyTotals[monthName].totalIn += amount;
                } else {
                    //Expense (negative amount)
                    monthlyTotals[monthName].totalOut += Math.abs(amount);
                }
                
            } catch (e) {
                console.error('Error processing transaction date:', e);
            }
        });
        
        console.log('Monthly totals calculated:', monthlyTotals);
        updateMonthCards(monthlyTotals);
    }
    
    function updateMonthCards(monthlyTotals) {
        //Update each month card with its totals
        monthCards.forEach(card => {
            const monthName = card.querySelector('h3').textContent;
            const totals = monthlyTotals[monthName];
            
            if (totals) {
                const paragraphs = card.querySelectorAll('p');
                
                //Update text content for each total
                if (paragraphs.length >= 2) {
                    // Total In
                    paragraphs[0].textContent = `Total In: $${totals.totalIn.toFixed(2)}`;
                    
                    // Total Out
                    paragraphs[1].textContent = `Total Out: $${totals.totalOut.toFixed(2)}`;
                    
                    
                }
            }
        });
    }
    
    function setEmptyValues() {
        //default values
        monthCards.forEach(card => {
            const paragraphs = card.querySelectorAll('p');
            
            if (paragraphs.length >= 2) {
                paragraphs[0].textContent = 'Total In: $0.00';
                paragraphs[1].textContent = 'Total Out: $0.00';
            }
        });
    }
});