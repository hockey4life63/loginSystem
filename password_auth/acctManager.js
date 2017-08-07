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

acctManager.createAcct = (userInfo, callback) => {
    bcrypt.hash(userInfo.password, 10, (err, hash) => {
        //check for username and create it if doesnt exist
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
        }).catch(data => {
            callback({
                msg: "system error",
                success: false
            })
        }) //db.user.findOne.then
    })
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

acctManager.checkUuid = (userInfo, callback)=>{
  let decodedToken;
  try {
    decodedToken = jwt.verify(userInfo.token, secret.secret);
  } catch(err) {
    // statements
    callback(err, true)
   return
  }
 
  //gets user info
  db.User.findOne({
    where:{
      id:decodedToken.id
    }
  }).then(results=>{

    //records time since last update
    let timeSinceUpdate = moment().diff(moment(userInfo.updatedAt), "seconds")
    if(results===null){
        callback({
        msg:"invalid token",
        success:false
      })
    } else if(results.uuid === decodedToken.uuid /*&& timeSinceUpdate <=6*60*60*/){
      //if within last 6 hours callback with same uuid
      let token = jwt.sign({
          id:decodedToken.id,
          uuid:decodedToken.uuid,
          name:decodedToken.name
        }, secret.secret);
      let resObj ={
            token,
            success:true
        }
      callback(resObj)
    } else if(results.uuid === decodedToken.uuid /*&& timeSinceUpdate<= 24*60*60*/){
      //if over 6 hours but within 24hours generate new key to use and callback with it
      acctManager.createNewUuid(results, (newUuid)=> {
        let token = jwt.sign({
          id:decodedToken.id,
          uuid:newUuid,
          name:decodedToken.name
        }, secret.secret);
        let resObj ={
            token,
            success:true
        }
        callback(resObj)
      })
    }else{
      //if incorrect or older than 24 hours return to login screen
      callback({
        msg:"invalid token",
        success:false
      })
    }
  })
}
acctManager.comparePassword = (req, callback) => {
    console.log(req.body.name)
    db.User.findOne({
       where:{ 
            name:req.body.name
           }
    }).then((userDbInfo)=>{
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
       callback({
            msg: "password does not match",
            success: false
        })
    })
}
    

module.exports = acctManager;