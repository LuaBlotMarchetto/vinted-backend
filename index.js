//import des packages
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

require("dotenv").config();

//creation du serveur
const app = express();

//securisation du frontend
app.use(cors());

//recuperation des données body des routes en post
app.use(express.json());

//connexion à la BDD
mongoose.connect(process.env.MONGODB_URI);

// Paramétrage de cloudinary:
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//import des routes
const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offers");
app.use(offerRoutes);

// route générale
app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

//mise en place de l'écoute
app.listen(process.env.PORT, () => {
  console.log("server has started");
});
