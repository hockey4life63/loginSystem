const express = require("express");
const exphbs = require("express-handlebars");
const db = require("../models");
const path = require("path");
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const bcrypt = require('bcrypt');
const acctManager = require("../password_auth/acctManager")


let router = express.Router();


router.post("/signup", (req, res) => acctManager.createAcct(req.body, results => res.json(results)))

router.post("/signin", (req, res) => acctManager.comparePassword(req, results => res.json(results)))

router.post("/check", (req, res) => {
    //body needs token
    acctManager.checkUuid(req.body, response => {
        if (response.success) {
            const resObj = {
                name: response.name,
                id: response.id,
                token: response.token,
                success: true,
                msg: "Valid Session"
            }
            res.json(resObj)
        } else {
            res.json({
                msg: "invalid token",
                success: false
            })
        }

    })
})

router.post("/forgot", (req, res)=>{
    acctManager.createForgotPasswordLink(req.body.username, req, (results)=>{
        res.json({
            address:results
        })
    })
})

router.get("/reset/:token", (req, res)=>{
    res.sendFile(path.join(__dirname, "/../public/testReset.html"))
})

router.post("/reset/:token", (req, res)=>{
    //look up token
    acctManager.checkResetToken(req.params.token, req.body.password, (results)=>{
        if(results.success){
            res.redirect("/")
        }
        
    })
    
    //set password to new one

})

module.exports = router;