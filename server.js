require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("./middlewares/logger");
const config = require("./config");

const app = express();

// Middleware CORS
app.use(cors({
  origin: config.frontUrl,
  credentials: true
}));

// Middleware JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend running",
    timestamp: new Date().toISOString()
  });
});

// Connexion MongoDB avec gestion des erreurs
mongoose.connect(config.mongoUri, {
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  logger.info("✅ MongoDB connecté avec succès");
})
.catch(err => {
  logger.error(`❌ Erreur de connexion MongoDB: ${err.message}`);
  process.exit(1);
});

// Émettre des avertissements si la connexion se coupe
mongoose.connection.on('disconnected', () => {
  logger.warn("⚠️ MongoDB déconnecté");
});

mongoose.connection.on('reconnected', () => {
  logger.info("✅ MongoDB reconnecté");
});

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api", require("./routes/deposit.routes"));
app.use("/api", require("./routes/withdraw.routes"));
app.use("/api/webhook", require("./routes/webhook.routes"));

// Middleware d'erreur global
app.use((err, req, res, next) => {
  logger.error(`Erreur non gérée: ${err.message}`);
  res.status(500).json({
    error: "Erreur serveur",
    message: config.env === 'development' ? err.message : undefined
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// Démarrage du serveur
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Backend lancé sur http://localhost:${PORT}`);
  logger.info(`📝 Environnement: ${config.env}`);
});
