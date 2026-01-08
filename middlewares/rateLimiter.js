const rateLimit = require('express-rate-limit');

// Limiteur pour les paiements (dépôts/retraits)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes de paiement, veuillez réessayer plus tard.'
  },
  standardHeaders: true, // Retourne rate limit info dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

module.exports = {
  paymentLimiter
};
