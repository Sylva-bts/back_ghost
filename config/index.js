/**
 * Configuration centralisée de l'application
 */
const config = {
  // Serveur
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // Base de données
  mongoUri: process.env.MONGO_URI,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: '7d',
  
  // OxaPay
  oxapay: {
    apiKey: process.env.OXAPAY_API_KEY,
    payoutApiKey: process.env.OXAPAY_PAYOUT_API_KEY,
    merchantId: process.env.OXAPAY_MERCHANT,
    baseUrl: 'https://api.oxapay.com/v1',
    callbackUrl: process.env.OXAPAY_CALLBACK_URL,
    sandbox: process.env.NODE_ENV !== 'production'
  },
  
  // Frontend
  frontUrl: process.env.FRONT_URL,
  
  // Limites de paiement
  payments: {
    deposit: {
      min: 1,
      max: 10000
    },
    withdraw: {
      min: 1,
      max: 5000
    }
  },
  
  // Validation
  validation: {
    addressLengthMin: 20,
    addressLengthMax: 100,
    validNetworks: ['TRC20', 'ERC20', 'BEP20']
  }
};

// Valider les variables d'environnement requises
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'OXAPAY_API_KEY',
  'OXAPAY_PAYOUT_API_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

module.exports = config;
