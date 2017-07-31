module.exports = function(sequelize, DataTypes) {

 var User = sequelize.define("User", {
    name:{
      type:DataTypes.STRING,
      allowNull:false,
      validate:{
        len:[4,35]
      }
    },
    pw_hash:{
      type:DataTypes.STRING,
      allowNull:false,
    },
    uuid:{
      type:DataTypes.STRING,
    }
  });
  return User;
};


