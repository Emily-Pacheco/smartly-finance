const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

//Import routes
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions'); 
const bankAccountRoutes = require('./routes/bankAccounts');

app.use(cors());  
app.use(express.json());  
app.use(express.static(path.join(__dirname, 'public')));  

//API Routes 
app.use('/api/login', loginRoutes);
app.use('/api/auth', registerRoutes);
app.use('/api/transactions', transactionRoutes); 
app.use('/api/bankAccounts', bankAccountRoutes);

// Fallback route
app.get('/api/accounts', async (req, res) => {
  try {
    console.log('GET /api/accounts (LEGACY) - Redirecting to /api/bankAccounts');
    
    //Forward to the new endpoint
    const response = await fetch(`http://localhost:${PORT}/api/bankAccounts`);
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error in legacy /api/accounts route:', error);
    
    // Fallback data
    const accounts = [
      { id: 1, name: 'Wallet', type: "Cash", balance: 100.00 },
      { id: 2, name: 'Bank Account', type: "Checking", balance: 1500.00 },
      { id: 3, name: 'Savings Account', type: "Savings", balance: 4500.00 }
    ];
    
    return res.json({ accounts });
  }
});


app.get('/api/monthlySummary', async (req, res) => {
  try {
    // SQL query to get monthly totals directly from database
    const query = `
      SELECT 
        MONTH(Date) as month,
        YEAR(Date) as year,
        SUM(CASE WHEN Amount >= 0 THEN Amount ELSE 0 END) as totalIn,
        SUM(CASE WHEN Amount < 0 THEN ABS(Amount) ELSE 0 END) as totalOut
      FROM transactions
      GROUP BY YEAR(Date), MONTH(Date)
      ORDER BY year, month
    `;
    
    const [results] = await pool.execute(query);
    console.log('Monthly summary results:', results);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthlySummary = {};
    
    monthNames.forEach(month => {
      monthlySummary[month] = { totalIn: 0, totalOut: 0, totalSavings: 0 };
    });
    
    results.forEach(row => {
      const monthName = monthNames[row.month - 1]; 
      const totalIn = parseFloat(row.totalIn || 0);
      const totalOut = parseFloat(row.totalOut || 0);
      
      monthlySummary[monthName] = {
        totalIn: totalIn,
        totalOut: totalOut,
        totalSavings: totalIn - totalOut
      };
    });
    
    console.log('Serving GET /api/monthlySummary', monthlySummary);
    res.json({ monthlySummary });
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
  
    const monthlySummary = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthNames.forEach(month => {
      monthlySummary[month] = { totalIn: 0, totalOut: 0, totalSavings: 0 };
    });
    
    res.json({ monthlySummary });
  }
});

// HTML Routes
app.get('/landingPage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loginAccount.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/Overview.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Overview.html'));
});

app.get('/bankAccounts.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bankAccounts.html'));
});

app.get('/transactions.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'transactions.html'));
});

app.get('/budgets.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'budgets.html'));
});

app.get('/budget-details.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'budget-details.html'));
});

app.use((req, res) => {
  res.status(404).send("Sorry, can't find that!");
});

// Start Server 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/landingPage in your browser`);
});