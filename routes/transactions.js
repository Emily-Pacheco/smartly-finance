const express = require('express');
const router = express.Router();
const pool = require('../database');

//Fetch all transactions
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/transactions - Fetching all transactions');

    const query = 'SELECT idTransactions, Name, Amount, Date, Description, Account_Type FROM transactions ORDER BY Date DESC';
    
    const [results] = await pool.execute(query);
    
    console.log(`Total transactions found: ${results.length}`);
    
    return res.json({ transactions: results });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

//Create a new transaction
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/transactions - Creating new transaction');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const name = req.body.name || req.body.Name;
    const amount = req.body.amount || req.body.Amount;
    const date = req.body.date || req.body.Date;
    const description = req.body.description || req.body.Description || '';
    const accountType = req.body.account_type || req.body.Account_Type;

    if (!name) {
      return res.status(400).json({ error: 'Transaction name is required' });
    }
    
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Transaction amount is required' });
    }
    
    if (!date) {
      return res.status(400).json({ error: 'Transaction date is required' });
    }
    
    if (!accountType) {
      return res.status(400).json({ error: 'Account type is required' });
    }

    let transactionDate;
    try {
      transactionDate = new Date(date);
      
      if (isNaN(transactionDate.getTime())) {
        console.error('Invalid date format:', date);
        return res.status(400).json({ error: 'Invalid date format' });
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth() + 1; 
    
    const monthDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const yearDate = `${year}-01-01`; 
    
    console.log(`Parsed dates - Month: ${monthDate}, Year: ${yearDate}`);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    // Try INSERT with all fields
    try {
      const query = 'INSERT INTO transactions (Name, Amount, Date, Description, Account_Type, Month, Year) VALUES (?, ?, ?, ?, ?, ?, ?)';
      const values = [name, numericAmount, date, description, accountType, monthDate, yearDate];
      
      console.log('Executing query with values:', values);
      
      const [result] = await pool.execute(query, values);
      
      console.log('Transaction created successfully with ID:', result.insertId);
      
      // Return the complete transaction data for the client
      const newTransaction = {
        id: result.insertId,
        idTransactions: result.insertId,
        Name: name,
        Amount: numericAmount,
        Date: date,
        Description: description,
        Account_Type: accountType
      };
      
      return res.status(201).json(newTransaction);
    } catch (dbError) {
      console.error('Database error when inserting transaction:', dbError);
      
      try {
        const simplifiedQuery = 'INSERT INTO transactions (Name, Amount, Date, Description, Account_Type) VALUES (?, ?, ?, ?, ?)';
        const simplifiedValues = [name, numericAmount, date, description, accountType];
        
        const [result] = await pool.execute(simplifiedQuery, simplifiedValues);
        
        console.log('Transaction created successfully with simplified query, ID:', result.insertId);
        
        return res.status(201).json({
          id: result.insertId,
          idTransactions: result.insertId,
          Name: name,
          Amount: numericAmount,
          Date: date,
          Description: description,
          Account_Type: accountType
        });
      } catch (simplifiedError) {
        console.error('Simplified query also failed:', simplifiedError);
        
        // Return a fallback response
        return res.status(500).json({ 
          error: 'Database error: ' + dbError.message,
          id: Date.now(),
          name: name,
          amount: numericAmount,
          date: date,
          description: description,
          account_type: accountType
        });
      }
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ error: 'Failed to create transaction: ' + error.message });
  }
});
//delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/transactions/${id} - Deleting transaction`);

    const query = 'DELETE FROM transactions WHERE idTransactions = ?';
    
    const [result] = await pool.execute(query, [id]);
    
    console.log('Delete result:', result);

    if (result.affectedRows === 0) {
      console.log(`Transaction not found with ID: ${id}`);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    console.log(`Transaction ${id} deleted successfully`);
    return res.json({ 
      message: 'Transaction deleted successfully',
      id: id
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({ error: 'Failed to delete transaction: ' + error.message });
  }
});

module.exports = router;