document.addEventListener('DOMContentLoaded', function() {
    const accountsList = document.querySelector('.accounts-list');
    const newAccountBtn = document.querySelector('.new-btn');
    const editAccountBtn = document.querySelector('.edit-btn');
    const deleteAccountBtn = document.querySelector('.delete-btn');

    let accounts = [];
    let selectedAccountId = null;
    loadFromLocalStorage();
    loadAccountsFromAPI();
    setupEventListeners();
    
    //Save accounts before unloading page
    window.addEventListener('beforeunload', function() {
        saveAccountsToLocalStorage();
    });
    
    function setupEventListeners() {
        if (newAccountBtn) {
            newAccountBtn.addEventListener('click', showNewAccountModal);
        }
        
        if (editAccountBtn) {
            editAccountBtn.addEventListener('click', function() {
                if (selectedAccountId) {
                    showEditAccountModal(selectedAccountId);
                } else {
                    alert('Please select an account to edit.');
                }
            });
        }
        
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', function() {
                if (selectedAccountId) {
                    deleteAccount(selectedAccountId);
                } else {
                    alert('Please select an account to delete.');
                }
            });
        }
    }
    
    function loadFromLocalStorage() {
        console.log('Loading accounts from localStorage...');
        try {
            const storedAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
            console.log('Loaded accounts from localStorage:', storedAccounts);

            if (storedAccounts.length === 0) {
                accounts = [
                   {id: 1, name: 'Wallet', type: 'Cash', balance: 100.00}, 
                   {id: 2, name: 'Bank Account', type: 'Checking', balance: 1500.00},
                   {id: 3, name: 'Savings Account', type: 'Savings', balance: 4500.00},
                ];
                console.log('Created default accounts');
                saveAccountsToLocalStorage();
            } else {
                accounts = storedAccounts;
            }
            renderAccounts();
        } catch (e) {
            console.error('Error loading accounts from localStorage:', e);
            accounts = [
               {id: 1, name: 'Wallet', type: 'Cash', balance: 100.00}, 
               {id: 2, name: 'Bank Account', type: 'Checking', balance: 1500.00},
               {id: 3, name: 'Savings Account', type: 'Savings', balance: 4500.00},
            ];
            saveAccountsToLocalStorage();
            renderAccounts();
        }
    }
    
    function loadAccountsFromAPI() {
        console.log('Loading accounts from API...');
        fetch('/api/bankAccounts')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response error');
            }
            return response.json();
        })
        .then(data => {
            console.log('Accounts loaded from API:', data);
            
            if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
                accounts = data.accounts;
                saveAccountsToLocalStorage();
                renderAccounts();
            }
        })
        .catch(error => {
            console.warn('Could not load accounts from API:', error);
        });
    }
    
    function saveAccountsToLocalStorage() {
        console.log('Saving accounts to localStorage:', accounts);
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }

    function renderAccounts() {
        if (!accountsList) {
            console.error('Accounts list element not found');
            return;
        }

        console.log('Rendering accounts:', accounts);
        accountsList.innerHTML = '';
        
        if (accounts.length === 0) {
            accountsList.innerHTML = `<p class="no-accounts">No accounts yet. Click the + button to add your first account!</p>`;
            return;
        }
        
        accounts.forEach(account => {
            const accountItem = document.createElement('div');
            accountItem.className = 'account-item';
            accountItem.setAttribute('data-id', account.id);

            const formattedBalance = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(account.balance);

            accountItem.innerHTML = `
                <div class="account-name">${account.name}</div>
                <div class="account-balance">${formattedBalance}</div>
            `;

            accountItem.addEventListener('click', function() {
                selectAccount(account.id);
            });

            accountsList.appendChild(accountItem);
        });
    }
    
    function selectAccount(accountId) {
        const accountItems = document.querySelectorAll('.account-item');
        accountItems.forEach(item => item.classList.remove('selected'));
        
        const selectedItem = document.querySelector(`.account-item[data-id="${accountId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            selectedAccountId = accountId;
            
            // Enable edit and delete buttons
            if (editAccountBtn) editAccountBtn.classList.add('active');
            if (deleteAccountBtn) deleteAccountBtn.classList.add('active');
        }
    }
    
    //Show new account modal
    function showNewAccountModal() {
        console.log('Opening new account modal');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Add New Account</h2>
                <form id="new-account-form">
                    <div class="form-group">
                        <label for="account-name">Account Name</label>
                        <input type="text" id="account-name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-type">Account Type</label>
                        <select id="account-type">
                            <option value="Cash">Cash</option>
                            <option value="Checking">Checking</option>
                            <option value="Savings">Savings</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Investment">Investment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-balance">Initial Balance</label>
                        <input type="number" id="account-balance" step="0.01" value="0.00" required>
                    </div>
                    
                    <button type="submit" class="submit-btn">Add Account</button>
                </form>
            </div>
        `;
        
        modal.style.display = 'flex';
 
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        //submission
        const form = modal.querySelector('#new-account-form');
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const name = document.getElementById('account-name').value;
            const type = document.getElementById('account-type').value;
            const balance = parseFloat(document.getElementById('account-balance').value);
            
            if (!name || isNaN(balance)) {
                alert('Please fill in all fields correctly.');
                return;
            }
            
            // Create account object
            const newAccount = {
                id: Date.now(),
                name: name,
                type: type,
                balance: balance
            };
            
            // Add to local array
            accounts.push(newAccount);
            
            // Save to localStorage immediately
            saveAccountsToLocalStorage();
            
            renderAccounts();
            selectAccount(newAccount.id);
            document.body.removeChild(modal);
            createAccountAPI(newAccount);
        });
    }
    
    function createAccountAPI(account) {
        fetch('/api/bankAccounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: account.name,
                type: account.type,
                balance: account.balance
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Account created via API:', data);
            if (data.id && data.id !== account.id) {
                const index = accounts.findIndex(acc => acc.id === account.id);
                if (index !== -1) {
                    accounts[index].id = data.id;
                    saveAccountsToLocalStorage();
                    renderAccounts();
                }
            }
        })
        .catch(error => {
            console.warn('API error (account already saved to localStorage):', error);
        });
    }
    
    //Show edit account modal
    function showEditAccountModal(accountId) {
        console.log('Opening edit account modal for account:', accountId);
        
        // Find the account to edit
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) {
            console.error('Account not found');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Account</h2>
                <form id="edit-account-form">
                    <div class="form-group">
                        <label for="account-name">Account Name</label>
                        <input type="text" id="account-name" value="${account.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-type">Account Type</label>
                        <select id="account-type">
                            <option value="Cash" ${account.type === 'Cash' ? 'selected' : ''}>Cash</option>
                            <option value="Checking" ${account.type === 'Checking' ? 'selected' : ''}>Checking</option>
                            <option value="Savings" ${account.type === 'Savings' ? 'selected' : ''}>Savings</option>
                            <option value="Credit Card" ${account.type === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                            <option value="Investment" ${account.type === 'Investment' ? 'selected' : ''}>Investment</option>
                            <option value="Other" ${account.type === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-balance">Current Balance</label>
                        <input type="number" id="account-balance" step="0.01" value="${account.balance}" required>
                    </div>
                    
                    <button type="submit" class="submit-btn">Update Account</button>
                </form>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        const form = modal.querySelector('#edit-account-form');
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const name = document.getElementById('account-name').value;
            const type = document.getElementById('account-type').value;
            const balance = parseFloat(document.getElementById('account-balance').value);
            
            if (!name || isNaN(balance)) {
                alert('Please fill in all fields correctly.');
                return;
            }
            
            //Check for name change to update transactions
            const oldName = account.name;
            
            //Update locally first
            const index = accounts.findIndex(acc => acc.id === accountId);
            if (index !== -1) {
                accounts[index].name = name;
                accounts[index].type = type;
                accounts[index].balance = balance;
                
                //Save to localStorage immediately
                saveAccountsToLocalStorage();
                
                //Update transactions if name changed
                if (oldName !== name) {
                    updateAccountNameInTransactions(oldName, name);
                }
                
                renderAccounts();
                selectAccount(accountId);
            }
            
            document.body.removeChild(modal);
            updateAccountAPI(accountId, { name, type, balance });
        });
    }
    
    function updateAccountAPI(accountId, accountData) {
        fetch(`/api/bankAccounts/${accountId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accountData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Account updated via API:', data);
        })
        .catch(error => {
            console.warn('API error (account already updated in localStorage):', error);
        });
    }
    
    function deleteAccount(accountId) {
        console.log('Deleting account:', accountId);
        
        if (!confirm('Are you sure you want to delete this account?')) {
            return;
        }
        
        //Find account for name reference
        const accountToDelete = accounts.find(acc => acc.id === accountId);
        const accountName = accountToDelete ? accountToDelete.name : null;
        
        //Remove locally first
        accounts = accounts.filter(acc => acc.id !== accountId);
        
        //Save to localStorage immediately
        saveAccountsToLocalStorage();
        
        // Update transactions if needed
        if (accountName) {
            updateDeletedAccountInTransactions(accountName);
        }
        
        renderAccounts();
        selectedAccountId = null;
        if (editAccountBtn) editAccountBtn.classList.remove('active');
        if (deleteAccountBtn) deleteAccountBtn.classList.remove('active');
        
        fetch(`/api/bankAccounts/${accountId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Account deleted via API:', data);
        })
        .catch(error => {
            console.warn('API error (account already deleted from localStorage):', error);
        });
    }
    
    function updateAccountNameInTransactions(oldName, newName) {
        console.log('Updating transactions from account:', oldName, 'to', newName);
        
        try {
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            let updated = false;
            
            transactions.forEach(transaction => {
                if (transaction.account_type === oldName) {
                    transaction.account_type = newName;
                    updated = true;
                }
            });
            
            if (updated) {
                localStorage.setItem('transactions', JSON.stringify(transactions));
                console.log('Updated transaction references to account');
            }
        } catch (error) {
            console.error('Error updating transaction references:', error);
        }
    }
    
    function updateDeletedAccountInTransactions(accountName) {
        console.log('Handling transactions for deleted account:', accountName);
        
        try {
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            let updated = false;
            
            transactions.forEach(transaction => {
                if (transaction.account_type === accountName) {
                    transaction.account_type = 'Deleted Account: ' + accountName;
                    updated = true;
                }
            });
            
            if (updated) {
                localStorage.setItem('transactions', JSON.stringify(transactions));
                console.log('Updated transactions for deleted account');
            }
        } catch (error) {
            console.error('Error updating transactions for deleted account:', error);
        }
    }
});