/**
 * MEILLEURES PRATIQUES ET BONNES CONFIGURATIONS
 * 
 * ⚠️ IMPORTANT: Lire avant de déployer en production
 */

// ============================================================
// 🔐 SÉCURITÉ - À FAIRE AVANT LA PRODUCTION
// ============================================================

/**
 * 1. VARIABLES D'ENVIRONNEMENT
 * 
 * JAMAIS mettre les clés directement dans le code!
 * Utiliser .env et .gitignore
 */
.gitignore:
  node_modules/
  .env
  .env.local
  *.log
  dist/
  build/

/**
 * 2. KEYS OXAPAY
 * 
 * Ne JAMAIS commiter les vraies clés sur GitHub!
 * Utiliser des variables d'environnement:
 */
.env:
  OXAPAY_API_KEY=votre_clé_réelle        // Pour dépôts
  OXAPAY_PAYOUT_API_KEY=votre_clé_réelle // Pour retraits

/**
 * 3. MODE SANDBOX vs PRODUCTION
 */
// En développement:
NODE_ENV=development  // Activera sandbox: true dans OxaPay

// En production:
NODE_ENV=production   // Désactivera sandbox

// Dans deposit.routes.js:
sandbox: process.env.NODE_ENV !== 'production'

/**
 * 4. CORS - À ADAPTER POUR PRODUCTION
 */
// ❌ Avant (ouvert à tous):
app.use(cors())

// ✅ Après (production):
app.use(cors({
  origin: process.env.FRONT_URL,  // Seulement votre domaine
  credentials: true
}))

/**
 * 5. RATE LIMITING
 */
// À configurer dans .env:
RATE_LIMIT_WINDOW_MS=15 * 60 * 1000  // 15 minutes
RATE_LIMIT_MAX_REQUESTS=20            // 20 requêtes max

// ============================================================
// 📡 WEBHOOKS - CONFIGURATION PRODUCTION
// ============================================================

/**
 * 1. URL CALLBACK PUBLIQUE
 * 
 * Mettre dans .env:
 */
OXAPAY_CALLBACK_URL=https://votre-domaine.com/api/webhook/oxapay

// Ou si vous avez des domaines multiples:
OXAPAY_CALLBACK_URL=https://api.escapeghost.com/api/webhook/oxapay

/**
 * 2. SIGNER LES WEBHOOKS (recommandé)
 * 
 * OxaPay envoie une signature dans les headers
 * À vérifier avant de traiter:
 */
const verifyWebhookSignature = (req) => {
  const signature = req.headers['x-oxapay-signature'];
  const expectedSignature = calculateSignature(req.body, process.env.OXAPAY_SECRET);
  return signature === expectedSignature;
};

/**
 * 3. IDEMPOTENCE DES WEBHOOKS
 * 
 * Les webhooks peuvent être appelés plusieurs fois
 * Implémentation: webhookService.processedWebhooks
 * 
 * Si vous persistez en BDD:
 */
db.webhooks.findOne({ trackId })
  ? (update existing)
  : (create new)

// ============================================================
// 🗄️ BASE DE DONNÉES - PRODUCTION
// ============================================================

/**
 * 1. CONNEXION MONGODB AVEC RETRY
 */
const mongoOptions = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

mongoose.connect(process.env.MONGO_URI, mongoOptions);

/**
 * 2. INDICES IMPORTANTS
 * 
 * Pour les requêtes fréquentes:
 */
// Transaction.find({ userId, status })
transactionSchema.index({ userId: 1, status: 1 })

// Transaction.findOne({ oxapayTrackId })
transactionSchema.index({ oxapayTrackId: 1 })

// Pagination requêtes de l'utilisateur
transactionSchema.index({ userId: 1, createdAt: -1 })

/**
 * 3. RETENTION DES DONNÉES
 * 
 * Implémenter TTL pour anciennes transactions:
 */
// Supprimer automatiquement après 90 jours
transactionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
)

// ============================================================
// 📝 LOGGING - PRODUCTION
// ============================================================

/**
 * Winston est déjà configuré mais à optimiser:
 */

// Créer des logs rotatifs (Winston rotate):
const DailyRotateFile = require('winston-daily-rotate-file');

const transport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});

logger.add(transport);

/**
 * Ne pas logger les infos sensibles:
 */
// ❌ Mauvais:
logger.info(`Payment with API key: ${process.env.OXAPAY_API_KEY}`)

// ✅ Bon:
logger.info(`Payment processed for user: ${userId}`)

/**
 * Utiliser les niveaux correctement:
 */
logger.error()     // Erreurs critiques
logger.warn()      // Avertissements
logger.info()      // Infos importantes
logger.debug()     // Debug (dev seulement)

// ============================================================
// 🔍 MONITORING - PRODUCTION
// ============================================================

/**
 * 1. HEALTHCHECK
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

/**
 * 2. MÉTRIQUES
 * 
 * Implémenter Prometheus ou Datadog:
 */
// Compter les paiements
payout_requests_total
payout_requests_success
payout_requests_failed

// Durée des requêtes
request_duration_ms

/**
 * 3. ALERTES
 * 
 * Configurer des alertes pour:
 */
// - Taux d'erreur > 5%
// - Webhook delays > 10s
// - MongoDB connection down
// - OxaPay API unreachable

// ============================================================
// 🚀 DÉPLOIEMENT - CHECKLIST
// ============================================================

/**
Avant de déployer en production:

☑ Tester tous les endpoints
☑ Vérifier les variables d'environnement
☑ Désactiver le mode sandbox
☑ Configurer CORS correctement
☑ Activer rate limiting
☑ Configurer les indices MongoDB
☑ Configurer les logs rotatifs
☑ Tester les webhooks OxaPay
☑ Implémenter le monitoring
☑ Configurer les backups BD
☑ Activer HTTPS/TLS
☑ Configurer WAF (Web Application Firewall)
☑ Tester la performance sous charge
☑ Plan de récupération d'erreurs
☑ Documentation d'exploitation
☑ SLA et RPO/RTO définis
*/

// ============================================================
// 📞 SUPPORT OXAPAY
// ============================================================

/**
Documentation:       https://docs.oxapay.com
Support Email:       support@oxapay.com
API Status Page:     status.oxapay.com
Webhook Testing:     https://webhook.site/

Statuut d'un Payout:
  pending      - En attente
  processing   - En cours de traitement
  paid         - Complété
  failed       - Échoué
  cancelled    - Annulé
*/

console.log('✅ Lire attentivement avant production!');
