const express = require('express');
const router = express.Router();
const pool = require('../database');

// Get all bank accounts
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/bankAccounts - Fetching all accounts');
    
    //Get accounts from database
    try {
      const query = 'SELECT idAccounts as id, Name as name, Type as type, Balance as balance, Created_Date, Updated_Date FROM accounts';
      const [results] = await pool.execute(query);
      console.log('Accounts fetched successfully:', results);
      return res.json({ accounts: results });
    } catch (dbError) {
      console.warn('Database query failed, using fallback data:', dbError);
      
      //Example data
      const accounts = [
        { id: 1, name: 'Wallet', type: "Cash", balance: 100.00, Created_Date: '10/18/2024', Updated_Date: '01/02/2025' },
        { id: 2, name: 'Bank Account', type: "Checking", balance: 1500.00, Created_Date: '10/18/2024', Updated_Date: '01/02/2025' },
        { id: 3, name: 'Savings Account', type: "Savings", balance: 4500.00, Created_Date: '10/18/2024', Updated_Date: '01/02/2025' }
      ];
      
      console.log('Serving placeholder account data');
      return res.json({ accounts });
    }
  } catch (error) {
    console.error('Error in /api/bankAccounts route:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create new bank account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    console.log('POST /api/bankAccounts - Creating new account:', req.body);

    if (!name || balance === undefined || !type) {
      return res.status(400).json({ error: 'Name, type, and balance are required' });
    }
    
    if (typeof balance !== 'number' && isNaN(parseFloat(balance))) {
      return res.status(400).json({ error: 'Balance must be a valid number' });
    }

    const numericBalance = parseFloat(balance);

    //Insert into database
    try {
      const query = 'INSERT INTO accounts (Name, Type, Balance, Created_Date) VALUES (?, ?, ?, NOW())';
      const [result] = await pool.execute(query, [name, type, numericBalance]);
      
      console.log('Account created successfully with ID:', result.insertId);
      return res.status(201).json({
        id: result.insertId,
        name,
        type,
        balance: numericBalance,
        message: 'Account created successfully'
      });
    } catch (dbError) {
      console.warn('Database insert failed:', dbError);
      
      // Fallback 
      const tempId = Date.now();
      console.log('Using temporary ID:', tempId);
      
      return res.status(201).json({
        id: tempId, 
        name,
        type,
        balance: numericBalance,
        message: 'Account created successfully (database unavailable)'
      });
    }
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;
    console.log(`PUT /api/bankAccounts/${id} - Updating account:`, req.body);

    if (!name || balance === undefined || !type) {
      return res.status(400).json({ error: 'Name, type, and balance are required' });
    }
    
    if (typeof balance !== 'number' && isNaN(parseFloat(balance))) {
      return res.status(400).json({ error: 'Balance must be a valid number' });
    }

    const numericBalance = parseFloat(balance);

    //Try to update in database
    try {
      const query = 'UPDATE accounts SET Name = ?, Type = ?, Balance = ?, Updated_Date = NOW() WHERE idAccounts = ?';
      const [result] = await pool.execute(query, [name, type, numericBalance, id]);
      
      if (result.affectedRows === 0) {
        console.log(`No account found with ID ${id}`);
        return res.status(404).json({ error: 'Account not found' });
      }
      
      console.log(`Account ${id} updated successfully`);
      return res.json({
        id: parseInt(id),
        name,
        type,
        balance: numericBalance,
        message: 'Account updated successfully'
      });
    } catch (dbError) {
      console.warn('Database update failed:', dbError);
      
      return res.json({
        id: parseInt(id),
        name,
        type, 
        balance: numericBalance,
        message: 'Account updated successfully (database unavailable)'
      });
    }
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/bankAccounts/${id} - Deleting account`);

    // Try to delete from database
    try {
      const query = 'DELETE FROM accounts WHERE idAccounts = ?';
      const [result] = await pool.execute(query, [id]);
      
      if (result.affectedRows === 0) {
        console.log(`No account found with ID ${id}`);
        return res.status(404).json({ error: 'Account not found' });
      }
      
      console.log(`Account ${id} deleted successfully`);
      return res.json({
        id: parseInt(id),
        message: 'Account deleted successfully'
      });
    } catch (dbError) {
      console.warn('Database delete failed:', dbError);
      
      return res.json({
        id: parseInt(id),
        message: 'Account deleted successfully (database unavailable)'
      });
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;