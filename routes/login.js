const express = require('express');
const router = express.Router();
const db = require('../database');

//route
router.post('/',async(req, res)=>{
    try{
        const{email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({error:"Email and password required"});
        }

        const[rows] = await db.query("SELECT idOwner, First_Name, Last_Name, Email, Phone, Accounts_idAccounts FROM owner WHERE Email = ? AND password = ?", 
                            [email, password]);

        if(rows.length ===0){
            return res.status(401).json({error: "Invalid Email or Password!"});
        }
        const user = rows[0];

        let primaryAccount = null;
        if(user.Accounts_idAccounts){
            const [ accountRows] = await db.query("SELECT idAccounts, Name, Type, Balance FROM accounts WHERE idAccounts = ? ",
                                             [user.Accounts_idAccounts]);
            if(accountRows.length > 0){
                primaryAccount = accountRows[0];
            }
        }

        const [ accounts] = await db.query("SELECT idAccounts, Name, Type, Balance FROM accounts WHERE Owner_idOwner = ?", 
                                        [user.idOwner]);

        res.json({
            success:true,
            user:{
                id: user.idOwner,
                firstName: user.First_Name,
                lastName: user.Last_Name,
                email: user.Email,
                phone: user.Phone,
                primaryAccountId: user.Accounts_idAccounts,
                primaryAccount: primaryAccount,
                accounts: accounts
            },
            message:"Login Successful!"
        });
    }catch(error){
        console.error('Error Logging In: ', error);
        res.status(500).json({error: "Failed to Login"});
    }

});
module.exports = router;