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
    let resetToken = uuidv4();
    db.User.findOne({
        where:{
            name:req.body.username
        }
    }).then(userInfo=>{
        //generate unique token
        //set to userdb
        db.User.update({
            password_reset_token:resetToken,
            password_reset_exp: moment().add(1,"h")
        },{
            where:{
                id:userInfo.id
            }
        }).then(results=>{
            //send email(or for now just send a new address)with link to reset age with token
            res.json({
                address:'http://' + req.headers.host + '/acct/reset/' + resetToken
            })
        })
        
    })
})

router.get("/reset/:token", (req, res)=>{
    res.sendFile(path.join(__dirname, "/../public/testReset.html"))
})

router.post("/reset/:token", (req, res)=>{
    //look up token
    db.User.findOne({
        where:{
            password_reset_token:req.params.token
        }
    }).then(userInfo=>{
         bcrypt.hash(req.body.password, 10, function(err, hash) {
            db.User.update({
                password_reset_token:"",
                password_rest_exp: "",
                pw_hash:hash
            },{
                where:{
                    id:userInfo.id
                }
            }).then(results=>{
                res.redirect("/")
            })
         })
    })
    
    //set password to new one

})

module.exports = router;