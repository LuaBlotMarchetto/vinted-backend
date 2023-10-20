const User = require("../models/User");

//Middleware d'authentification

const isAuthenticated = async (req,res,next) => {
    try {
        //recuperation du Bearer token envoyé dans authorization
        const currentToken = req.headers.authorization.replace("Bearer ","");
        
        //recherche d'un utilisateur avec le token correspondant
        const existingUser = await User.findOne({
            token: currentToken
          });
      
        const user = {
            account: {
                username: existingUser.account.username,
                avatar: null
            },
            _id: existingUser._id
        }  
    
        //creation d'une clé user sur l'objet req puis transmission à la fct suivante
        req.user = user;
        next();
        
    } catch (error) {
        res.status(400).json({message: "the authentification failed"});
        
    }
};

module.exports = isAuthenticated;