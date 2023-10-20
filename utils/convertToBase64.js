//fonction utilitaire de conversion des images en chaine de caractères base64
const convertToBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
  };


  module.exports = convertToBase64;