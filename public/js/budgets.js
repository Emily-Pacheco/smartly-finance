document.addEventListener('DOMContentLoaded', function() {
    const budgetsContainer = document.getElementById('budgets-container');
    const addBudgetBtn = document.getElementById('add-btn');
    const deleteBudgetBtn = document.getElementById('delete-btn');
    const selectBtn = document.getElementById('select-btn');
    const addBudgetModal = document.getElementById('add-budget-modal');
    const newBudgetForm = document.getElementById('new-budget-form');
    const closeModalBtn = document.querySelector('.close');

    let selectMode = false;
    let selectedBudgets = [];
    loadBudgets();

    console.log('Elements found:', {
        budgetsContainer,
        addBudgetBtn,
        deleteBudgetBtn,
        selectBtn,
        addBudgetModal,
        newBudgetForm,
        closeModalBtn
    });

    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', openAddBudgetModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAddBudgetModal);
    } else {
        console.error("Close modal button not found");
    }
    
    if (newBudgetForm) {
        newBudgetForm.addEventListener('submit', createNewBudget);
    }
    
    if (selectBtn) {
        selectBtn.addEventListener('click', toggleSelectionMode);
    }
    
    if (deleteBudgetBtn) {
        deleteBudgetBtn.addEventListener('click', deleteSelectedBudgets);
    }

    window.addEventListener('click', function(event) {
        if (event.target === addBudgetModal) {
            closeAddBudgetModal();
        }
    });

    function openAddBudgetModal() {
        console.log('Opening add budget modal');
        if (addBudgetModal) {
            addBudgetModal.style.display = 'block';
        }
    }

    function closeAddBudgetModal() {
        console.log('Closing add budget modal');
        if (addBudgetModal) {
            addBudgetModal.style.display = 'none';
        }
        if (newBudgetForm) {
            newBudgetForm.reset();
        }
    }


    function createNewBudget(e) {
        e.preventDefault();
        console.log('Creating new budget');

        const budgetName = document.getElementById('budget-name').value;
        const budgetType = document.getElementById('budget-type').value;

        console.log('Budget data:', { budgetName, budgetType });

        const newBudget = {
            id: Date.now(),
            name: budgetName,
            type: budgetType,
            categories: [],
            created: new Date().toISOString()
        };

        // Default categories
        if (budgetType === 'paycheck') {
            newBudget.categories = [
                {name: 'Income', items: [], budgetTotal: '0.00', actualTotal: '0.00'},
                {name: 'Savings', items: [], budgetTotal: '0.00', actualTotal: '0.00'},
                {name: 'Bills', items: [], budgetTotal: '0.00', actualTotal: '0.00'},
                {name: 'Expenses', items: [], budgetTotal: '0.00', actualTotal: '0.00'}
            ];
        } else {
            newBudget.categories = [
                {name: 'Income', items: [], budgetTotal: '0.00', actualTotal: '0.00'},
                {name: 'Expenses', items: [], budgetTotal: '0.00', actualTotal: '0.00'}
            ];
        }

        //Save to localStorage
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        budgets.push(newBudget);
        localStorage.setItem('budgets', JSON.stringify(budgets));

        console.log('Budget saved to localStorage');
        addBudgetCard(newBudget);
        closeAddBudgetModal();
        loadBudgets();
    }

    function loadBudgets() {
        console.log('Loading budgets from localStorage');
        
        if (!budgetsContainer) {
            console.error("Budget container not found");
            return;
        }
        
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        console.log('Loaded budgets:', budgets);
        if (budgets.length === 0) {
            budgetsContainer.innerHTML = '<p class="no-budgets">No budgets yet. Click the + button to create your first budget! :)</p>';
            return;
        }

        budgetsContainer.innerHTML = '';
        budgets.forEach(budget => {
            addBudgetCard(budget);
        });
    }

    function addBudgetCard(budget) {
        if (!budgetsContainer) {
            console.error("Budget container not found");
            return;
        }
        
        console.log('Adding budget card for:', budget.name);
        
        const budgetCard = document.createElement('div');
        budgetCard.className = 'budget-card';
        budgetCard.setAttribute('data-id', budget.id);
        budgetCard.innerHTML = `<h2>${budget.name}</h2>`;

        budgetCard.addEventListener('click', function(e) {
            if (selectMode) {
                toggleCardSelection(budgetCard);
            } else {
                openBudgetDetail(budget.id);
            }
        });
        
        budgetsContainer.appendChild(budgetCard);
    }

   

     function toggleSelectionMode() {
        console.log('Toggling selection mode');
        selectMode = !selectMode;
        
        const budgetCards = document.querySelectorAll('.budget-card');
        
        if (selectMode) {
            selectBtn.textContent = 'CANCEL';
            selectBtn.classList.add('active');
            deleteBudgetBtn.classList.add('active');
            
            budgetCards.forEach(card => {
                card.classList.add('selectable');
            });
        } else {
            selectBtn.textContent = 'SELECT';
            selectBtn.classList.remove('active');
            deleteBudgetBtn.classList.remove('active');
            
            budgetCards.forEach(card => {
                card.classList.remove('selectable');
                card.classList.remove('selected');
            });
            
            selectedBudgets = [];
        }
    }
    
    function toggleCardSelection(card) {
        console.log('Toggling card selection');
        const budgetId = card.getAttribute('data-id');
        
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            selectedBudgets = selectedBudgets.filter(id => id !== budgetId);
        } else {
            card.classList.add('selected');
            selectedBudgets.push(budgetId);
        }
        
        console.log('Selected budgets:', selectedBudgets);
    }
    
    function deleteSelectedBudgets() {
        console.log('Deleting selected budgets:', selectedBudgets);
        
        if (selectedBudgets.length === 0) {
            alert('Please select at least one budget to delete.');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${selectedBudgets.length} budget(s)?`)) {
            const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
            
            const updatedBudgets = budgets.filter(budget => 
                !selectedBudgets.includes(budget.id.toString())
            );
            
            localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
            
            clearSelection();
            toggleSelectionMode();
            loadBudgets();
        }
    }

    function clearSelection() {
        selectedBudgets = [];
        document.querySelectorAll('.budget-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    function openBudgetDetail(budgetId) {
        console.log('Opening budget detail for ID:', budgetId);
        localStorage.setItem('currentBudgetId', budgetId);
        window.location.href = 'budget-details.html';
    }
});