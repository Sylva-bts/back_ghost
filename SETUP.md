# 🚀 Guide Complet de Configuration

## Installation Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env
cp .env.example .env

# 3. Configurer les variables d'environnement
# Éditer .env avec vos clés OxaPay

# 4. Valider la configuration
npm run validate

# 5. Démarrer le serveur
npm start
```

## Structure du Projet

```
back_ghost/
├── config/              # Configuration centralisée
│   └── index.js        # Variables d'env et config
├── middlewares/        # Middlewares Express
│   ├── auth.js        # JWT authentication
│   ├── logger.js      # Winston logger
│   └── rateLimiter.js # Rate limiting
├── models/            # Modèles MongoDB
│   ├── Transaction.js # Schéma transactions
│   └── User.js       # Schéma utilisateurs
├── routes/           # Routes API
│   ├── auth.routes.js
│   ├── deposit.routes.js
│   ├── withdraw.routes.js
│   └── webhook.routes.js
├── services/        # Services métier
│   ├── oxapay.js   # OxaPay payout
│   └── webhook.js  # Webhook processing
├── utils/          # Utilitaires
│   └── errors.js  # Classes d'erreurs
├── server.js       # Point d'entrée
├── validate.js     # Script de validation
└── test-api.js    # Tests API
```

## Variables d'Environnement Requises

```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# JWT
JWT_SECRET=votre_secret_tres_long_et_securise

# OxaPay - Dépôts
OXAPAY_API_KEY=votre_api_key_depot

# OxaPay - Retraits
OXAPAY_PAYOUT_API_KEY=votre_payout_api_key

# OxaPay - Configuration
OXAPAY_MERCHANT=votre_merchant_id
OXAPAY_CALLBACK_URL=https://votre-domaine.com/api/webhook/oxapay

# Frontend
FRONT_URL=https://votre-frontend.com
```

## Endpoints API

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Dépôts
- `POST /api/deposit` - Créer un dépôt
- `GET /api/deposit/:txId` - Vérifier le statut

### Retraits
- `POST /api/withdraw` - Demander un retrait
- `GET /api/withdraw/:txId/status` - Vérifier le statut

### Webhooks
- `POST /api/webhook/oxapay` - Notifications OxaPay
- `GET /api/webhook/transaction/:trackId` - Vérifier statut

## Commandes Disponibles

```bash
# Démarrer en développement
npm run dev

# Démarrer en production
npm start

# Valider la configuration
npm run validate

# Tester les endpoints
node test-api.js

# Voir les logs
tail -f combined.log
tail -f error.log
```

## Flux de Paiement - Dépôt

1. Client: `POST /api/deposit` avec montant
2. Backend: Crée transaction (pending)
3. Backend: Appelle OxaPay pour générer facture
4. Frontend: Redirige vers la page de paiement OxaPay
5. Client: Paie sur OxaPay
6. OxaPay: Envoie webhook `POST /api/webhook/oxapay`
7. Backend: Traite le webhook, ajoute le solde
8. Transaction: Marquée comme "completed"

## Flux de Paiement - Retrait

1. Client: `POST /api/withdraw` avec adresse et montant
2. Backend: Valide les données
3. Backend: Déduit le montant du solde immédiatement
4. Backend: Appelle OxaPay pour effectuer le payout
5. Backend: Crée transaction (processing)
6. OxaPay: Effectue le payout
7. OxaPay: Envoie webhook de confirmation
8. Backend: Traite le webhook
9. Transaction: Marquée comme "completed"
10. Si erreur: Solde remboursé automatiquement

## Sécurité

✅ JWT pour authentification
✅ Rate limiting sur endpoints de paiement
✅ Validation stricte des données
✅ Transactions MongoDB ACID
✅ Gestion des doublons de webhooks
✅ Logs complets des opérations
✅ Clés API en variables d'environnement

## Monitoring et Logs

Les logs sont enregistrés dans:
- `combined.log` - Tous les logs
- `error.log` - Erreurs uniquement

Pour surveiller en temps réel:
```bash
tail -f combined.log
```

## Déploiement Production

1. Configurer NODE_ENV=production
2. Désactiver le mode sandbox OxaPay
3. Configurer CORS pour votre domaine
4. Configurer HTTPS/TLS
5. Configurer les indices MongoDB
6. Mettre en place le monitoring
7. Tester les webhooks OxaPay
8. Documenter le processus de récupération d'erreurs

## Support et Documentation

- [Documentation OxaPay](https://docs.oxapay.com)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Documentation](https://jwt.io/)

## Dépannage Courant

### Erreur: "ECONNREFUSED"
- S'assurer que MongoDB est lancé
- Vérifier l'URI MongoDB dans .env

### Erreur: "Invalid API Key"
- Vérifier les clés OxaPay dans .env
- Vérifier qu'elles sont correctes dans le dashboard OxaPay

### Erreur: "Rate limit exceeded"
- Attendre 15 minutes avant de réessayer
- Réduire le nombre de requêtes

### Erreur: "Webhook not received"
- Vérifier l'URL callback dans .env
- Vérifier que le domaine est accessible publiquement
- Tester avec webhook.site

## Prochaines Étapes

1. ✓ Installation et configuration
2. ✓ Tests des endpoints
3. ✓ Intégration frontend
4. ✓ Tests en production
5. ✓ Monitoring et alertes

---

**Dernière mise à jour:** 2025-01-18
**Version:** 1.0.0
