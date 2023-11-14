//imports des packages
const express = require("express");
const router = express.Router();
const fileupload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated.js");
const convertToBase64 = require("../utils/convertToBase64");

//import des models
const Offer = require("../models/Offer");
const User = require("../models/User");

//publier une annonce
router.post(
  "/offer/publish",
  fileupload(),
  isAuthenticated,
  async (req, res) => {
    try {
      //création d'une annonce à partir des informations transmises dans le body
      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ETAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        owner: req.user,
      });

      await newOffer.save();

      //enregistrement de la photo
      const pictureToUpload = req.files.picture;
      const readablePicture = convertToBase64(pictureToUpload);
      const result = await cloudinary.uploader.upload(readablePicture, {
        folder: `vinted/offers/${newOffer._id}`,
      });
      newOffer.product_image = result;

      await newOffer.save();
      await newOffer.populate("owner", "account _id");

      res.json(newOffer);
    } catch (error) {
      res.status(500).json(error.message);
    }
  }
);

//Afficher des offres
router.get("/offers", async (req, res) => {
  try {
    // if (req.query)
    let { title, priceMin, priceMax, sort, page } = req.query;

    let filters = {};
    let sorting = {};

    //nombre de résultats par page
    let limit = 10;

    //paramétrage des filtres
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin && priceMax) {
      filters.product_price = { $gte: priceMin, $lte: priceMax };
    } else {
      if (priceMin) {
        filters.product_price = { $gte: priceMin };
      }

      if (priceMax) {
        filters.product_price = { $lte: priceMax };
      }
    }

    //paramétrage du tri
    if (sort === "price-desc") {
      sorting.product_price = "desc";
    }

    if (sort === "price-asc") {
      sorting.product_price = "asc";
    }

    if (!page) {
      page = 1;
    }

    //récupération des offres correspondates
    const offers = await Offer.find(filters)
      .sort(sorting)
      .limit(limit)
      .skip(limit * (page - 1));

    const numberOfOffers = await Offer.countDocuments(filters);

    res.status(200).json({
      count: numberOfOffers,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

//modifier une annonce
router.put("/offer/:id", fileupload(), isAuthenticated, async (req, res) => {
  try {
    //récupération de l'annonce d'après son id
    const offer = await Offer.findById(req.params.id);

    //gestion du cas : l'id n'existe pas en bdd
    if (!offer) {
      return res.status(400).json({ message: "incorrect id" });
    }

    //modification des informations à partir de celles envoyées dans le body
    offer.product_name = req.body.title;
    offer.product_description = req.body.description;
    offer.product_price = req.body.price;
    offer.product_details = [
      { MARQUE: req.body.brand },
      { TAILLE: req.body.size },
      { ETAT: req.body.condition },
      { COULEUR: req.body.color },
      { EMPLACEMENT: req.body.city },
    ];
    offer.owner = req.user;

    const pictureToUpload = req.files.picture;
    const result = await cloudinary.uploader.upload(
      convertToBase64(pictureToUpload),
      { folder: `vinted/offers/${offer._id}` }
    );
    offer.product_image = result;

    //sauvegarde des modifications
    await offer.save();
    await offer.populate("owner", "account _id");

    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

//supprimer une annonce
router.delete("/offer/delete/:id", async (req, res) => {
  try {
    //récupération d'une annonce grâce à son id et et suppression
    const offer = await Offer.findByIdAndDelete(req.params.id);

    //gestion du cas : l'id n'existe pas en bdd
    if (!offer) {
      return res.status(400).json({ message: "incorrect id" });
    }

    res.status(200).json({ message: "offer successfully deleted" });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

//afficher une seule offre d'après son id
router.get("/offer/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (id) {
      //recherche de l'offre en bdd grâce à son id
      const offer = await Offer.findById(id).populate("owner", "account _id");

      //renvois d'une sélection d'informations liées à l'offre trouvée
      res.status(200).json({
        product_details: offer.product_details,
        product_pictures: [],
        _id: offer.id,
        product_name: offer.product_name,
        product_description: offer.product_description,
        product_price: offer.product_price,
        owner: offer.owner,
        product_image: offer.product_image,
      });
    } else {
      res.status(400).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = router;
