document.addEventListener('DOMContentLoaded', function() {
    const newTransactionBtn = document.querySelector('.new-transaction-btn');
    const filterSelect = document.querySelector('.filter-select');
    const deleteTransactionBtn = document.querySelector('.delete-transaction-btn');
    const transactionList = document.querySelector('.transaction-list');

    console.log('Transactions page loaded');
    console.log('Elements found:', {
        newTransactionBtn,
        filterSelect,
        deleteTransactionBtn,
        transactionList
    });

    let selectedTransactionId = null;

    if (newTransactionBtn) {
        newTransactionBtn.addEventListener('click', showTransactionModal);
    }
    
    if (deleteTransactionBtn) {
        deleteTransactionBtn.addEventListener('click', function() {
            if (selectedTransactionId) {
                deleteTransaction(selectedTransactionId);
            } else {
                alert('Please select a transaction to delete.');
            }
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const filterValue = this.value;
            filterTransactions(filterValue);
        });
    }

    fetchTransactions();
  
    function showTransactionModal() {
        console.log('Opening transaction modal');
      
        // Create the main modal container div
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>New Transaction</h2>

                <form id="transaction-form">
                    <div class="form-group">
                        <label for="transaction-name">Description</label>
                        <input type="text" id="transaction-name" required>
                    </div>

                    <div class="form-group">
                        <label for="transaction-amount">Amount</label>
                        <input type="number" id="transaction-amount" step="0.01" required>
                        <small>Use negative numbers for expenses</small>
                    </div>

                    <div class="form-group">
                        <label for="transaction-date">Date</label>
                        <input type="date" id="transaction-date" required>
                    </div>

                    <div class="form-group">
                        <label for="transaction-account">Account</label>
                        <select id="transaction-account" required>
                            <option value="">Select Account</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="transaction-description">Additional Notes (Optional)</label>
                        <textarea id="transaction-description"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Add Transaction</button>
                </form>
            </div>
        `;

        // Make sure modal is visible
        modal.style.display = 'flex';
        document.body.appendChild(modal);

        // Default Date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayFormatted = `${year}-${month}-${day}`;
        document.getElementById('transaction-date').value = todayFormatted;

        fetchAccounts(); 

        // Add Event Listeners for Modal
        // Close modal when the 'X' button is clicked
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
      
        //Form submission
        const form = modal.querySelector('#transaction-form');
        form.addEventListener('submit', handleTransactionSubmit);
    }
  
    async function handleTransactionSubmit(event) {
        event.preventDefault();
        
        //Get form values
        const name = document.getElementById('transaction-name').value;
        const amount = document.getElementById('transaction-amount').value;
        const date = document.getElementById('transaction-date').value;
        const account = document.getElementById('transaction-account').value;
        const description = document.getElementById('transaction-description').value || '';
        
        const formData = {
            name: name,
            amount: amount,
            date: date,
            account_type: account,
            description: description
        };
         
        console.log('Submitting transaction:', formData);
        
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('POST response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error('Failed to create Transaction: ' + errorText);
            }

            const data = await response.json();
            console.log('Transaction created successfully:', data);
            
            //Add the transaction to localStorage
            const localTransaction = {
                id: data.id,
                name: formData.name,
                amount: formData.amount,
                date: formData.date,
                account_type: formData.account_type,
                description: formData.description
            };
            
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions.push(localTransaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            console.log('Updated localStorage transactions:', transactions);

            const modal = document.querySelector('.modal');
            document.body.removeChild(modal);

            fetchTransactions();
            alert('Transaction added successfully!');
            
        } catch (error) {
            console.error('Error creating transaction:', error);
            
            // Fallback
            const newTransaction = {
                id: Date.now(),
                name: formData.name,
                amount: formData.amount,
                date: formData.date,
                account_type: formData.account_type,
                description: formData.description
            };
            
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions.push(newTransaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            console.log('Added transaction to localStorage (fallback):', newTransaction);
            
            const modal = document.querySelector('.modal');
            if (modal) document.body.removeChild(modal);
            
            fetchTransactions();
            alert('Transaction added successfully (offline mode).');
        }
    }

    async function fetchTransactions() {
        console.log('Fetching transactions...');
        
        try {
            const response = await fetch('/api/transactions');
            
            if (!response.ok) {
                console.error('Failed to fetch transactions, status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            console.log('Transactions fetched from API:', data);
            
            if (data.transactions && Array.isArray(data.transactions)) {
                displayTransactions(data.transactions);
                
                // Save to localStorage for backup
                localStorage.setItem('transactions', JSON.stringify(data.transactions));
            } else {
                console.error('Invalid transactions data format:', data);
                throw new Error('Invalid transactions data format');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            
            //Fallback 
            const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            console.log('Using transactions from localStorage:', localTransactions);
            displayTransactions(localTransactions);
        }
    }

    function displayTransactions(transactions) {
        if (!transactionList) {
            console.error('Transaction list element not found');
            return;
        }
        
        console.log('Displaying transactions:', transactions);
        transactionList.innerHTML = '';

        if (!transactions || transactions.length === 0) {
            transactionList.innerHTML = '<p class="no-transactions">No transactions yet. Click the + button to add your first transaction!</p>';
            return;
        }

        transactions.forEach(transaction => {
            console.log('Processing transaction:', transaction);
            
            const transactionItem = document.createElement('div');
            const amount = parseFloat(transaction.Amount || transaction.amount || 0);
            const isIncome = amount >= 0;
            
            transactionItem.className = `transaction-item ${isIncome ? 'income' : 'expense'}`;
            transactionItem.dataset.id = transaction.idTransactions || transaction.id;

            let dateStr = transaction.Date || transaction.date;
            let formattedDate;
            
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    console.error('Invalid date:', dateStr);
                    formattedDate = 'Invalid date';
                } else {
                    formattedDate = date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    });
                }
            } catch (e) {
                console.error('Error formatting date:', e);
                formattedDate = 'Date error';
            }

            const formattedAmount = `${isIncome ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
            const transactionName = transaction.Name || transaction.name || 'Unnamed';
            const accountType = transaction.Account_Type || transaction.account_type || 'Unknown Account';
            
            transactionItem.innerHTML = `
                <div class="transaction-date">${formattedDate}</div>
                <div class="transaction-desc">${transactionName}</div>
                <div class="transaction-account">${accountType}</div>
                <div class="transaction-amount">${formattedAmount}</div>
            `;
            
            // Add click handler for selection
            transactionItem.addEventListener('click', () => {
                document.querySelectorAll('.transaction-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                transactionItem.classList.add('selected');
                selectedTransactionId = transaction.idTransactions || transaction.id;
                console.log('Selected transaction ID:', selectedTransactionId);
            });
            
            transactionList.appendChild(transactionItem);
        });
    }

    async function fetchAccounts() {
        console.log('Fetching accounts for transaction form...');
        
        try {
            const response = await fetch('/api/accounts');
            if (!response.ok) throw new Error('Failed to fetch accounts');

            const data = await response.json();
            console.log('Accounts fetched:', data);
            
            const accountSelect = document.getElementById('transaction-account');
            if (!accountSelect) {
                console.error('Account select element not found');
                return;
            }

            accountSelect.innerHTML = '<option value="">Select Account</option>';

            if (data.accounts && data.accounts.length > 0) {
                data.accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.name;
                    option.textContent = account.name;
                    accountSelect.appendChild(option);
                });
                console.log('Added account options:', data.accounts.length);
            } else {
                console.warn('No accounts found in data');
                addDefaultAccountOptions(accountSelect);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            
            const accountSelect = document.getElementById('transaction-account');
            if (!accountSelect) return;
            
            accountSelect.innerHTML = '<option value="">Select Account</option>';
            
            try {
                const storedAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
                if (storedAccounts.length > 0) {
                    storedAccounts.forEach(account => {
                        const option = document.createElement('option');
                        option.value = account.name;
                        option.textContent = account.name;
                        accountSelect.appendChild(option);
                    });
                    console.log('Added account options from localStorage:', storedAccounts.length);
                } else {
                    addDefaultAccountOptions(accountSelect);
                }
            } catch (e) {
                console.error('Error loading accounts from localStorage:', e);
                addDefaultAccountOptions(accountSelect);
            }
        }
    }
    
    function addDefaultAccountOptions(selectElement) {
        ['Wallet', 'Bank Account', 'Savings Account'].forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            selectElement.appendChild(option);
        });
        console.log('Added default account options');
    }

    
    function filterTransactions(filterValue) {
        console.log('Filtering transactions by:', filterValue);
        const transactions = document.querySelectorAll('.transaction-item');
      
        transactions.forEach(transaction => {
            if (filterValue === 'all') {
                transaction.style.display = 'grid';
            } else if (filterValue === 'income' && transaction.classList.contains('income')) {
                transaction.style.display = 'grid';
            } else if (filterValue === 'expense' && transaction.classList.contains('expense')) {
                transaction.style.display = 'grid';
            } else {
                transaction.style.display = 'none';
            }
        });
    }

    async function deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        
        console.log('Deleting transaction with ID:', id);
        
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);
                throw new Error('Failed to delete transaction');
            }

            //remove from localStorage
            try {
                const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
                const filteredTransactions = transactions.filter(t => 
                    String(t.id) !== String(id) && String(t.idTransactions) !== String(id)
                );
                localStorage.setItem('transactions', JSON.stringify(filteredTransactions));
                console.log('Updated localStorage after delete');
            } catch (e) {
                console.error('Error updating localStorage after delete:', e);
            }

            fetchTransactions();
            selectedTransactionId = null;
            alert('Transaction deleted successfully!');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            
            // Fallback
            try {
                const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
                const filteredTransactions = transactions.filter(t => 
                    String(t.id) !== String(id) && String(t.idTransactions) !== String(id)
                );
                localStorage.setItem('transactions', JSON.stringify(filteredTransactions));
                
                fetchTransactions();
                selectedTransactionId = null;
                alert('Transaction deleted successfully (offline mode).');
            } catch (e) {
                console.error('Error updating localStorage:', e);
                alert('Failed to delete transaction. Please try again.');
            }
        }
    }
});