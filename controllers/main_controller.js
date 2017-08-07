const express = require("express");
const db = require("../models");
const path = require("path");
const acctManager = require("../password_auth/acctManager")

const router = express.Router();

router.get("/", (req, res) => res.sendFile(path.join(__dirname, "/../public/test.html")))

//hash the password
router.post("/login/create", (req, res) => acctManager.createAcct(req.body, results => res.json(results)))

//find user in db, then compare the given password to stored hash
router.post("/login", (req, res) => {
    db.User.findOne({
        name: req.body.name
    }).then(results => {
        acctManager.comparePassword(req, res, results.dataValues)
    }).catch(data => {
        res.json({
            msg: "password does not match",
            success: false
        })
    })
})

router.post("/login/check", (req, res) => {
    //body needs uuid and name
    acctManager.checkUuid(req.body, res, token => {
        const resObj = {
            name: req.body.name,
            id: req.body.id,
            token: token,
            success: true,
            msg: "Valid Session"
        }
        res.json(resObj)
    })
})

module.exports = router;