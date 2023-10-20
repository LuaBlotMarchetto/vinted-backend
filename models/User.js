//imports
const mongoose = require("mongoose");

//modèle
const User = mongoose.model("User",{
        email: {
          type: String,
          unique: true,
          required: true
        },
        account: {
          username: String,
          avatar: Object, 
        },
        newsletter: Boolean,
        token: String,
        hash: String,
        salt: String,
});

module.exports = User;