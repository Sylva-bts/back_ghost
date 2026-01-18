const express = require("express");
const router = express.Router();
const logger = require("../middlewares/logger");
const webhookService = require("../services/webhook");

/**
 * Webhook pour les notifications OxaPay
 * Appelé par OxaPay quand le statut d'une transaction change
 */
router.post("/oxapay", async (req, res) => {
  try {
    const { trackId, status, type, amount } = req.body;

    // Validation basique des données
    if (!trackId || !status) {
      logger.warn(`Invalid webhook data: missing trackId or status`);
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    // Traiter le webhook
    const result = await webhookService.processWebhook({
      trackId,
      status,
      type,
      amount
    });

    // Retourner un succès à OxaPay
    res.json({
      success: true,
      message: "Webhook processed",
      trackId,
      transactionStatus: result.status
    });
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    
    // Retourner une erreur mais avec un statut 200 pour qu'OxaPay ne réessaie pas indéfiniment
    res.status(200).json({
      success: false,
      error: error.message,
      message: "Webhook received but processing failed"
    });
  }
});

/**
 * Endpoint pour vérifier le statut d'une transaction via trackId
 * À usage interne/API
 */
router.get("/transaction/:trackId", async (req, res) => {
  try {
    const { trackId } = req.params;

    if (!trackId) {
      return res.status(400).json({ error: "trackId required" });
    }

    const status = await webhookService.getTransactionStatus(trackId);
    res.json(status);
  } catch (error) {
    logger.error(`Transaction status check error: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
