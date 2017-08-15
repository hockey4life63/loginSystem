const db = require("../models");
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const jwt = require("jsonwebtoken");
const secret = require("../config/secret");

// var token = jwt.sign(user, app.get('superSecret'), {
//           expiresInMinutes: 1440 // expires in 24 hours
//         })

const acctManager = {};

const _checkUsernameAndPassword = (name, password) => {
    let userErrors = [];
    let passwordErrors = [];
    if (name.length < 4 || name.length > 20) {
        errs.push("Usernmae must be between 4 and 20 characters")
    }
    if (!name.match(/^[a-zA-Z0-9_-]{4,20}$/g))
        if (!name[0].match(/[a-zA-Z]/g)) {
            uerrErrors.push("Username must start with a letter")
        }
    if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z@#$%]{6,30}$/g)) {
        passwordErrors.push("password must contain at lease one uppercase and lowercase letter and 1 number and only these @#$% symbols and be between 8-30 characters long")
    }
    return {
        userErrors,
        passwordErrors,
        success: (userErrors.length === 0 && passwordErrors.length === 0)
    }
}

acctManager.createAcct = (userInfo, callback) => {
    console.log(userInfo)
    let errors = _checkUsernameAndPassword(userInfo.name, userInfo.password)
    if (errors.success) {
        bcrypt.hash(userInfo.password, 10, function(err, hash) {
            //check for usernmae and create it if doesnt exist
            db.User.findOrCreate({
                where: {
                    name: userInfo.name
                },
                defaults: {
                    pw_hash: hash,
                    uuid: uuidv4()
                }
            }).then(results => {
                //if created a new one send response
                console.log(results)
                let resObj;
                if (results.includes(true)) {
                    //create new token 
                    let token = jwt.sign({
                        name: results[0].name,
                        id: results[0].id,
                        uuid: results[0].uuid,
                    }, secret.secret);
                    //if created a new one send response
                    resObj = {
                        msg: "account created",
                        success: true,
                        token,
                        uuid: results[0].uuid,
                        name: results[0].name,
                        id: results[0].id
                    }

                } else {
                    //if false send a false
                    resObj = {
                        msg: "account name already exists try agian",
                        success: false
                    }
                }
                callback(resObj)
            }).catch((data) => {
                callback({
                    msg: "system error",
                    success: false
                }, true)
            }) //db.user.findOne.then
        })
    } else {
        callback({
            msg: [errors.passwordErrors, errors.passwordErrors],
            success: false
        })
    }
}
acctManager.createNewUuid = (userInfo, callback) => {
    //create a new uuid and assigns it
    const newUuid = uuidv4();
    db.User.update({
        uuid: newUuid
    }, {
        where: {
            id: userInfo.id
        }
    }).then(() => callback(newUuid))
}

acctManager.checkUuid = (userInfo, callback) => {
    let decodedToken;
    try {
        decodedToken = jwt.verify(userInfo.token, secret.secret);
    } catch (err) {
        // statements
        callback(err, true)
        return
    }

    //gets user info
    db.User.findOne({
        where: {
            id: decodedToken.id
        }
    }).then(results => {

        //records time since last update
        let timeSinceUpdate = moment().diff(moment(results.updatedAt), "seconds")
        if (results === null) {
            callback({
                msg: "invalid token",
                success: false
            })
        } else if (results.uuid === decodedToken.uuid && timeSinceUpdate <= 6 * 60 * 60) {
            //if within last 6 hours callback with same uuid
            let token = jwt.sign({
                id: decodedToken.id,
                uuid: decodedToken.uuid,
                name: decodedToken.name
            }, secret.secret);
            let resObj = {
                id: decodedToken.id,
                name: decodedToken.name,
                token,
                success: true
            }
            callback(resObj)
        } else if (results.uuid === decodedToken.uuid && timeSinceUpdate <= 24 * 60 * 60) {
            //if over 6 hours but within 24hours generate new key to use and callback with it
            acctManager.createNewUuid(results, (newUuid) => {
                let token = jwt.sign({
                    id: decodedToken.id,
                    uuid: newUuid,
                    name: decodedToken.name
                }, secret.secret);
                 let resObj = {
                id: decodedToken.id,
                name: decodedToken.name,
                token,
                success: true
            }
                callback(resObj)
            })
        } else {
            //if incorrect or older than 24 hours return to login screen
            callback({
                msg: "invalid token",
                success: false
            })
        }
    })
}
acctManager.comparePassword = (req, callback) => {
    console.log(req.body.name)
    db.User.findOne({
        where: {
            name: req.body.name
        }
    }).then((userDbInfo) => {
        if(userDbInfo === null){
            callback({
                msg:"username or password is incorrect",
                success:false
            })
            return;
        }
        bcrypt.compare(req.body.password, userDbInfo.pw_hash, (err, matched) => {
            //if matches update with new uuid
            const newUuid = uuidv4();
            let resObj;
            if (matched) {
                db.User.update({
                    uuid: newUuid
                }, {
                    where: {
                        id: userDbInfo.id
                    }
                }).then(data => {
                    let token = jwt.sign({
                        id: userDbInfo.id,
                        uuid: newUuid,
                        name: userDbInfo.name
                    }, secret.secret);
                    //return new uuid to browser 
                    resObj = {
                        msg: "login successfull",
                        success: true,
                        id: userDbInfo.id,
                        token,
                        uuid: newUuid,
                        name: userDbInfo.name,
                    }
                    callback(resObj)
                }).catch(err => {
                    console.log(err)
                    resObj = {
                        msg: "login failed",
                        success: false
                    }
                    callback(resObj)
                })
            } else {
                //if failed send response
                resObj = {
                    msg: "login failed",
                    success: false,
                }
                callback(resObj)
            } //else

        }) //compare
    }).catch(data => {
        console.log(data)
        callback({
            msg: "password does not match",
            success: false
        })
    })
}


module.exports = acctManager;