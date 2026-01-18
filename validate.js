/**
 * Script de validation de la configuration
 * Execute: node validate.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./middlewares/logger');
const config = require('./config');

console.log('🔍 Validation de la configuration...\n');

// 1. Vérifier les variables d'environnement
console.log('✅ Variables d\'environnement:');
console.log(`  PORT: ${config.port}`);
console.log(`  NODE_ENV: ${config.env}`);
console.log(`  MONGO_URI: ${config.mongoUri?.substring(0, 50)}...`);
console.log(`  OxaPay API Key: ${config.oxapay.apiKey?.substring(0, 10)}...`);
console.log(`  OxaPay Payout Key: ${config.oxapay.payoutApiKey?.substring(0, 10)}...`);

// 2. Vérifier les fichiers critiques
const fs = require('fs');
console.log('\n✅ Fichiers critiques:');
const criticalFiles = [
  'models/Transaction.js',
  'models/User.js',
  'routes/auth.routes.js',
  'routes/deposit.routes.js',
  'routes/withdraw.routes.js',
  'routes/webhook.routes.js',
  'services/oxapay.js',
  'services/webhook.js',
  'config/index.js',
  'server.js'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - MANQUANT!`);
  }
});

// 3. Tester la connexion MongoDB
console.log('\n🔗 Test de connexion MongoDB...');
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('  ✓ Connexion MongoDB réussie');
    
    // 4. Vérifier les collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.log('  ✗ Erreur lors du listage des collections');
      } else {
        console.log('  ✓ Collections disponibles:');
        collections.forEach(col => {
          console.log(`    - ${col.name}`);
        });
      }
      
      mongoose.connection.close();
      console.log('\n✅ Validation complète!');
    });
  })
  .catch(err => {
    console.log(`  ✗ Erreur de connexion: ${err.message}`);
    console.log('\n❌ Validation échouée');
    process.exit(1);
  });
