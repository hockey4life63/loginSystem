const express = require("express");
const db = require("../models");
const path = require("path");
const acctManager = require("../password_auth/acctManager")

const router = express.Router();

router.get("/", (req, res) => res.sendFile(path.join(__dirname, "/../public/test.html")))


module.exports = router;