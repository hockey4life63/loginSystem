# Simple login system
---
## needs a sequelize config file to work
`sequelize init:config` 
---
### Uses 
* node.js
* bcrypt
* body-parser 
* express
* moment
* mysql
* mysql2
* sequelize
* uuid
---
### Returned JSON
Returns a JSON object with 5 pieces of information back to browser upon sucessfull actions

```javascript
{
  msg:"account created", //msg about action
  sucess:true, //if action was sucessfull or not
  uuid: uuid, //current session id
  name:username, //current usernmae for login
  id:DBid //id in database
}
```
