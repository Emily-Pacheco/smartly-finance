const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/register', async(req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        if(!firstName || !lastName || !email || !password) {
            return res.status(400).json({error: 'All fields are required!'});
        }

        // Check if user already exists
        const [existingUsers] = await db.query("SELECT * FROM owner WHERE Email = ?", [email]);

        if(existingUsers.length > 0) {
            return res.status(409).json({error: "User already exists"});
        }
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            // New User
            const insertOwnerSql = "INSERT INTO owner (First_Name, Last_Name, Email, Phone, password, Accounts_idAccounts) VALUES (?, ?, ?, ?, ?, NULL)";
            const [ownerResult] = await connection.query(insertOwnerSql, [firstName, lastName, email, phone || null, password]);
            const ownerId = ownerResult.insertId;
            
            // Default account
            const createAccountSql = "INSERT INTO accounts(Name, Type, Balance, Created_Date, Updated_Date, Owner_idOwner) VALUES (?, ?, ?, NOW(), NOW(), ?)";
            const [accountResult] = await connection.query(createAccountSql, ['My Wallet', 'Cash', 0.00, ownerId]);
            const accountId = accountResult.insertId;

            // Update owner w/ new accountID
            const updateOwnerSql = "UPDATE owner SET Accounts_idAccounts = ? WHERE idOwner = ?";
            await connection.query(updateOwnerSql, [accountId, ownerId]);

            await connection.commit();

            res.status(201).json({success: true, message:"Registration Successful"});
        } catch(error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }  
    } catch(error) {
        console.error('Error registering user', error);
        res.status(500).json({error: "Failed to register user"});
    }
});

module.exports = router;