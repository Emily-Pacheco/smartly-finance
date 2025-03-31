document.addEventListener('DOMContentLoaded', function() {
    // Sample data
    const financialData = [
        { title: 'Total Assets', value: '$126,500', trend: 'up' },
        { title: 'Total Liabilities', value: '$43,200', trend: 'down' },
        { title: 'Net Worth', value: '$83,300', trend: 'up' },
        { title: 'Monthly Income', value: '$5,400', trend: 'stable' }
    ];
    
    const summaryCards = document.getElementById('summary-cards');
    
    //financial summary cards
    financialData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${item.title}</h3>
            <p class="value">${item.value}</p>
            <p class="trend ${item.trend}">${item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}</p>
        `;
        summaryCards.appendChild(card);
    });
    
});