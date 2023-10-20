//import de spackages
const express = require("express");
const fileupload = require("express-fileupload");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const convertToBase64 = require("../utils/convertToBase64");

const router = express.Router();

//import des models
const User = require("../models/User");

//Sign up 
router.post("/user/signup",fileupload(), async(req,res)=>{
    try {
        //recherche en bdd de l'existance d'un utilisateur avec l'email saisi
        const userAlreadyExists = await User.findOne({'email': req.body.email});

        if(req.body.username){
            //gestion du cas : aucun utilisateur trouvé pour l'email saisi
            if(!userAlreadyExists){
                //récupération du mdp choisi et encodage
                const password = req.body.password;
                const salt = uid2(16);
                const hash = SHA256(password + salt).toString(encBase64);
                const token = uid2(16);
                
                //creation de l'utilisateur 
                const newUser = await new User({
                    email: req.body.email,
                    account: {
                        username: req.body.username
                    },
                    newsletter: req.body.newsletter,
                    token: token,
                    hash: hash,
                    salt: salt,
                });
                
                //enregistrement d'un avatar
                const pictureToUpload = req.files.picture;
                const result = await cloudinary.uploader.upload(convertToBase64(pictureToUpload), {folder: `vinted/avatars/${newUser._id}`});
                newUser.account.avatar = result;
                
                //sauvegarde de l'utilisateur
                await newUser.save();

                //renvoi d"une sélection d'informations liées au compte 
                res.status(200).json({
                    _id: newUser._id,
                    token: newUser.token,
                    account: newUser.account
                });
    
            }else{
                //gestion du cas : l'utilisateur existe déjà
                res.status(400).json({message: "A user with this email already exists, please login"});
            }
        }else{
            //gestion du cas: aucun nom d'ulitisateur saisi
            res.status(400).json({message: "The username is missing"});
        }
        
    } catch (error) {
        res.status(500).json(error.message);
    }

});



//Login route
router.post("/user/login",async(req,res)=>{
    try {
        //récupération des informations envoyées dans le body
        const email = req.body.email;
        const password = req.body.password;

        //recherche en bdd d'un utilisateur avec l'email saisi
        const existingUser = await User.findOne({'email': email});

        //gestion du cas : l'utilisateur existe en bdd
        if(existingUser){
            const hash = SHA256(password + existingUser.salt).toString(encBase64);
            //vérification du mot de passe
            if(existingUser.hash === hash){
                res.status(200).json({
                    _id: existingUser._id,
                    token: existingUser.token,
                    account: existingUser.account
                });
            }else{
                  //gestion du cas : mdp erronné
                res.status(400).json({message: "Unauthorized"});
            }
        }else{
              //gestion du cas : l'utilisateur n'existe pas en bdd
            res.status(400).json({message: "There is no user with this email, please sign up first"});
        }
        
    } catch (error) {
        res.status(500).json(error.message);
    }
    
});



module.exports = router;
