document.addEventListener('DOMContentLoaded', function() {
    const budgetTitle = document.getElementById('budget-title');
    const tablesContainer = document.getElementById('budget-tables');
    const saveBtn = document.getElementById('save-budget');
    const backBtn = document.getElementById('back-to-budgets');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const addCategoryModal = document.getElementById('add-category-modal');
    const newCategoryForm = document.getElementById('new-category-form');
    const closeModalBtn = document.querySelector('.close');
    
    const currentBudgetId = localStorage.getItem('currentBudgetId');
    let currentBudget = null;
    
    loadCurrentBudget();
    if(backBtn){
        backBtn.addEventListener('click', goBackToBudgets);
    }else {console.error("Back button not found")};
    if(saveBtn){saveBtn.addEventListener('click', saveBudget);}
    if(addCategoryBtn){addCategoryBtn.addEventListener('click', openAddCategoryModal);}
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAddCategoryModal);
    }
    
    if(newCategoryForm){newCategoryForm.addEventListener('submit', addNewCategory);}
    
    window.addEventListener('click', function(event) {
        if (event.target === addCategoryModal) {
            closeAddCategoryModal();
        }
    });
    
    //load the current budget from localStorage
    function loadCurrentBudget() {
        console.log('Loading current budget, ID:',currentBudget);
        if (!currentBudgetId) {
            console.warn('No current budget ID found, redirecting to budgets.html');
            window.location.href = 'budgets.html';
            return;
        }
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        console.log('All budgets from localStorage:', budgets);
        //Find the current budget by ID
        currentBudget = budgets.find(budget => budget.id.toString() === currentBudgetId.toString());
        if (!currentBudget) {
            console.warn('Budget not found with ID:', currentBudgetId);
            window.location.href = 'budgets.html';
            return;
        }
        console.log('Current budget loaded:', currentBudget);
        //Set budget title or other info
        if (budgetTitle) {
            budgetTitle.textContent = currentBudget.name;
        }
        
        //Load budget info
        const payDateInput = document.getElementById('payDate');
        const payAmountInput = document.getElementById('payAmount');
        const periodInput = document.getElementById('period');
        
        if (payDateInput) payDateInput.value = currentBudget.payDate || '';
        if (payAmountInput) payAmountInput.value = currentBudget.payAmount || '';
        if (periodInput) periodInput.value = currentBudget.period || '';
        
        renderBudgetTables();
        addSummaryTable();
    }
    
    //Function to render all budget category tables
    function renderBudgetTables() {
        if (!tablesContainer) {
            console.error('Tables container not found');
            return;
        }
        
        tablesContainer.innerHTML = '';
        
        if (!currentBudget || !currentBudget.categories) {
            console.error('Current budget or categories not found');
            return;
        }
        
        currentBudget.categories.forEach((category, index) => {
            if (category.name !== 'Summary') {
                addCategoryTable(category, index);
            }
        });
    }
    
    //Add a category
    function addCategoryTable(category, index) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'budget-table-container';
        tableContainer.innerHTML = `
            <h3>
                ${category.name}
                <span class="delete-category" data-index="${index}">&times;</span>
            </h3>
            <table class="budget-table" id="table-${index}">
                <thead>
                    <tr>
                        <th>${category.name}</th>
                        <th>Budget</th>
                        <th>Actual</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                    <tr>
                        <td>Total:</td>
                        <td id="budget-total-${index}">${category.budgetTotal || '0.00'}</td>
                        <td id="actual-total-${index}">${category.actualTotal || '0.00'}</td>
                    </tr>
                </tfoot>
            </table>
            <button class="add-row-btn" data-table="${index}">+ Add Row</button>
        `;
        
        tablesContainer.appendChild(tableContainer);
        
        //Add event listener for delete category button
        const deleteBtn = tableContainer.querySelector('.delete-category');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const categoryIndex = parseInt(this.getAttribute('data-index'));
            deleteCategory(categoryIndex);
        });
        
        //Add event listener for add row button
        const addRowBtn = tableContainer.querySelector('.add-row-btn');
        addRowBtn.addEventListener('click', function() {
            const tableIndex = parseInt(this.getAttribute('data-table'));
            addTableRow(tableIndex);
        });
        
        //Add existing rows or a blank row if no items exist
        const tbody = tableContainer.querySelector('tbody');
        if (category.items && category.items.length > 0) {
            category.items.forEach(item => {
                addRowToTable(tbody, item, index);
            });
        } else {
            addRowToTable(tbody, { description: '', budget: '', actual: '' }, index);
        }
    }
    
    function addRowToTable(tbody, item, tableIndex) {
        const row = document.createElement('tr');
        row.className = 'item-row';
        row.innerHTML = `
            <td><input type="text" placeholder="Description" value="${item.description || ''}" data-field="description"></td>
            <td><input type="number" step="0.01" placeholder="0.00" value="${item.budget || ''}" data-field="budget"></td>
            <td><input type="number" step="0.01" placeholder="0.00" value="${item.actual || ''}" data-field="actual"></td>
        `;
        
        //Add input event listeners to update totals
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                updateCategoryTotals(tableIndex);
            });
        });
        
        tbody.appendChild(row);
    }

     //Add a new row to a table
    function addTableRow(tableIndex) {
        const tableBody = document.querySelector(`#table-${tableIndex} tbody`);
        addRowToTable(tableBody, { description: '', budget: '', actual: '' }, tableIndex);
        updateCategoryTotals(tableIndex);
    }

    //Update category totals
    function updateCategoryTotals(categoryIndex) {
        const table = document.getElementById(`table-${categoryIndex}`);
        const rows = table.querySelectorAll('tbody tr');
        
        let budgetTotal = 0;
        let actualTotal = 0;
        
        //Calculate totals from all rows
        rows.forEach(row => {
            const budgetInput = row.querySelector('input[data-field="budget"]');
            const actualInput = row.querySelector('input[data-field="actual"]');
            
            budgetTotal += parseFloat(budgetInput.value) || 0;
            actualTotal += parseFloat(actualInput.value) || 0;
        });
        
        //Update totals in table
        document.getElementById(`budget-total-${categoryIndex}`).textContent = budgetTotal.toFixed(2);
        document.getElementById(`actual-total-${categoryIndex}`).textContent = actualTotal.toFixed(2);
        currentBudget.categories[categoryIndex].budgetTotal = budgetTotal.toFixed(2);
        currentBudget.categories[categoryIndex].actualTotal = actualTotal.toFixed(2);
        updateSummaryTable();
    }
    
    //Add summary table
    function addSummaryTable() {
        //if summary table exists dont add a new one
        if (document.querySelector('.summary-table')) {
            updateSummaryTable();
            return;
        }
        
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'budget-table-container summary-table';
        summaryContainer.innerHTML = `
            <h3>Summary</h3>
            <table class="budget-table" id="summary-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Budget</th>
                        <th>Actual</th>
                        <th>Difference</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>Overall Total</strong></td>
                        <td id="overall-budget-total">0.00</td>
                        <td id="overall-actual-total">0.00</td>
                        <td id="overall-difference">0.00</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        tablesContainer.appendChild(summaryContainer);
        updateSummaryTable();
    }
    
    function updateSummaryTable() {
        const summaryTable = document.getElementById('summary-table');
        if (!summaryTable) return;
        
        const tbody = summaryTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        let overallBudgetTotal = 0;
        let overallActualTotal = 0;
        
        currentBudget.categories.forEach(category => {
            if (category.name !== 'Summary') {
                const budgetTotal = parseFloat(category.budgetTotal) || 0;
                const actualTotal = parseFloat(category.actualTotal) || 0;
                const difference = actualTotal - budgetTotal;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${category.name}</td>
                    <td>${budgetTotal.toFixed(2)}</td>
                    <td>${actualTotal.toFixed(2)}</td>
                    <td class="${difference < 0 ? 'negative' : 'positive'}">${difference.toFixed(2)}</td>
                `;
                
                tbody.appendChild(row);
                overallBudgetTotal += budgetTotal;
                overallActualTotal += actualTotal;
            }
        });
        const overallDifference = overallActualTotal - overallBudgetTotal;
        
        document.getElementById('overall-budget-total').textContent = overallBudgetTotal.toFixed(2);
        document.getElementById('overall-actual-total').textContent = overallActualTotal.toFixed(2);
        
        const overallDifferenceElement = document.getElementById('overall-difference');
        overallDifferenceElement.textContent = overallDifference.toFixed(2);
        overallDifferenceElement.className = overallDifference < 0 ? 'negative' : 'positive';
    }
    
    //Open add category modal
    function openAddCategoryModal() {
        addCategoryModal.style.display = 'block';
    }
    
    //Close add category modal
    function closeAddCategoryModal() {
        addCategoryModal.style.display = 'none';

    }
    
    //Add a new category
    function addNewCategory(e) {
        e.preventDefault();
        
        const categoryName = document.getElementById('category-name').value;
        
        if (!categoryName.trim()) {
            alert('Please enter a category name');
            return;
        }
        
        const newCategory = {
            name: categoryName,
            items: [],
            budgetTotal: '0.00',
            actualTotal: '0.00'
        };
        
        currentBudget.categories.push(newCategory);
        
        addCategoryTable(newCategory, currentBudget.categories.length - 1);
        
        closeAddCategoryModal();
        
        updateSummaryTable();
    }
    
    //Redirect back to budgets page
    function goBackToBudgets() {
        window.location.href = 'budgets.html';
    }
    
    //delete a category
    function deleteCategory(categoryIndex) {
        if (confirm(`Are you sure you want to delete the ${currentBudget.categories[categoryIndex].name} category?`)) {
           
            currentBudget.categories.splice(categoryIndex, 1);
            renderBudgetTables();
            updateSummaryTable();
        }
    }
    
    //save budget
    function saveBudget() {
        currentBudget.payDate = document.getElementById('payDate').value;
        currentBudget.payAmount = document.getElementById('payAmount').value;
        currentBudget.period = document.getElementById('period').value;
    
        currentBudget.categories.forEach((category, categoryIndex) => {
            if (category.name !== 'Summary') {
                const table = document.getElementById(`table-${categoryIndex}`);
                if (table) {
                    const rows = table.querySelectorAll('tbody tr');
                    const items = [];
                    
                    rows.forEach(row => {
                        const descriptionInput = row.querySelector('input[data-field="description"]');
                        const budgetInput = row.querySelector('input[data-field="budget"]');
                        const actualInput = row.querySelector('input[data-field="actual"]');
                        
                        if (descriptionInput.value.trim() !== '') {
                            items.push({
                                description: descriptionInput.value,
                                budget: budgetInput.value,
                                actual: actualInput.value
                            });
                        }
                    });
                    
                    category.items = items;
                }
            }
        });
        //save to localstorage
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        const budgetIndex = budgets.findIndex(budget => budget.id.toString() === currentBudgetId.toString());
        
        if (budgetIndex !== -1) {
            budgets[budgetIndex] = currentBudget;
            localStorage.setItem('budgets', JSON.stringify(budgets));
            
            alert('Budget saved successfully!');
        }
    }  
    
    
});