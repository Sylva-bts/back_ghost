/**
 * Exemples de requêtes API
 * A tester avec Postman, curl ou ThunderClient
 */

// ============ AUTHENTIFICATION ============

// POST /api/auth/register
// Créer un compte
{
  "username": "user123",
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

// POST /api/auth/login
// Se connecter et récupérer le JWT
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

// Réponse:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "user123",
    "email": "user@example.com",
    "balance": 0
  }
}

// ============ DÉPÔTS ============

// POST /api/deposit
// Headers: Authorization: Bearer <JWT_TOKEN>
// Créer un dépôt et obtenir le lien de paiement OxaPay
{
  "amount": 50
}

// Réponse:
{
  "success": true,
  "payUrl": "https://pay.oxapay.com/...",
  "txId": "507f1f77bcf86cd799439011",
  "trackId": "OXAPAY_TRACK_ID_123",
  "amount": 50
}

// GET /api/deposit/:txId
// Headers: Authorization: Bearer <JWT_TOKEN>
// Vérifier le statut d'un dépôt
// Réponse:
{
  "txId": "507f1f77bcf86cd799439011",
  "status": "processing",
  "amount": 50,
  "type": "deposit",
  "createdAt": "2024-01-18T10:30:00Z",
  "updatedAt": "2024-01-18T10:35:00Z"
}

// ============ RETRAITS ============

// POST /api/withdraw
// Headers: Authorization: Bearer <JWT_TOKEN>
// Demander un retrait
{
  "amount": 25,
  "address": "TLBz41r3p33PoPqnysKsZMb1Axuh5gucqJ",  // Adresse TRX
  "network": "TRC20"  // Optionnel, par défaut TRC20
}

// Réponse:
{
  "message": "Retrait demandé avec succès",
  "txId": "507f1f77bcf86cd799439011",
  "trackId": "OXAPAY_TRACK_ID_456"
}

// GET /api/withdraw/:txId/status
// Headers: Authorization: Bearer <JWT_TOKEN>
// Vérifier le statut d'un retrait
// Réponse:
{
  "txId": "507f1f77bcf86cd799439011",
  "status": "processing",
  "oxapayStatus": {
    "status": "pending",
    "trackId": "OXAPAY_TRACK_ID_456"
  },
  "amount": 25
}

// ============ WEBHOOKS ============

// POST /api/webhook/oxapay
// Appelé automatiquement par OxaPay (ne pas appeler manuellement)
{
  "trackId": "OXAPAY_TRACK_ID_123",
  "status": "paid",
  "type": "deposit",
  "amount": 50
}

// GET /api/webhook/transaction/:trackId
// Vérifier le statut d'une transaction via trackId OxaPay
// Réponse:
{
  "txId": "507f1f77bcf86cd799439011",
  "type": "deposit",
  "status": "completed",
  "amount": 50,
  "createdAt": "2024-01-18T10:30:00Z",
  "updatedAt": "2024-01-18T10:35:00Z"
}

// ============ CODES D'ERREUR ============

// 400 Bad Request - Données invalides
{
  "error": "Montant invalide (1-10000 USD)"
}

// 401 Unauthorized - JWT manquant ou invalide
{
  "error": "Authentification requise"
}

// 404 Not Found - Ressource non trouvée
{
  "error": "Transaction non trouvée"
}

// 429 Too Many Requests - Rate limit dépassé
{
  "error": "Trop de requêtes, veuillez réessayer plus tard"
}

// 500 Internal Server Error - Erreur serveur
{
  "error": "Erreur serveur lors du dépôt"
}

// ============ ADRESSES DE TEST (TRC20) ============
// TLBz41r3p33PoPqnysKsZMb1Axuh5gucqJ
// TQCqV9fvbXDWNcTvf4YP9Ykf6j9VK4uGKE
// TSx8mAaMFz9pqvVSDSZxZ8y9x48SQ8fKLG
