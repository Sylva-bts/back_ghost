const express = require("express");
const router = express.Router();
const axios = require("axios");
const Transaction = require("../models/Transaction");
const auth = require("../middlewares/auth");
const logger = require("../middlewares/logger");
const { paymentLimiter } = require("../middlewares/rateLimiter");

router.post("/deposit", paymentLimiter, auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);

    // Valider le montant
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 10000) {
      logger.warn(`Invalid deposit amount: ${amount} by user ${req.userId}`);
      return res.status(400).json({ error: "Montant invalide (1-10000 USD)" });
    }

    // Créer la transaction en attente
    const tx = await Transaction.create({
      userId: req.userId,
      type: "deposit",
      amount: numAmount,
      currency: "USD",
      status: "pending"
    });

    logger.info(`Deposit transaction created: ${tx._id} for user ${req.userId}`);

    // Appel à OxaPay pour générer une facture de paiement
    try {
      const paymentInvoice = await axios.post(
        "https://api.oxapay.com/v1/payment/invoice",
        {
          merchant: process.env.OXAPAY_API_KEY,
          amount: numAmount,
          currency: "USD",
          lifetime: 30, // 30 minutes
          fee_paid_by_payer: 1, // Client paie les frais
          under_paid_coverage: 2.5, // Couverture pour sous-paiement
          to_currency: "USDT",
          auto_withdrawal: false,
          mixed_payment: true,
          callback_url: process.env.OXAPAY_CALLBACK_URL,
          return_url: process.env.FRONT_URL,
          email: "support@escapeghost.com",
          order_id: tx._id.toString(),
          description: "Dépôt EscapeGhost",
          sandbox: process.env.NODE_ENV !== 'production' // Mode test en dev
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Sauvegarder le trackId d'OxaPay
      tx.oxapayTrackId = paymentInvoice.data.track_id;
      tx.status = "processing";
      await tx.save();

      logger.info(`Payment invoice created: trackId=${paymentInvoice.data.track_id}`);

      res.json({
        success: true,
        payUrl: paymentInvoice.data.pay_link,
        txId: tx._id,
        trackId: paymentInvoice.data.track_id,
        amount: numAmount
      });
    } catch (oxapayError) {
      logger.error(`OxaPay invoice creation failed: ${oxapayError.message}`);
      
      // Marquer la transaction comme échouée
      tx.status = "failed";
      tx.errorMessage = oxapayError.response?.data?.message || oxapayError.message;
      await tx.save();

      res.status(500).json({
        error: "Erreur lors de la création du paiement",
        details: oxapayError.response?.data?.message || oxapayError.message
      });
    }
  } catch (error) {
    logger.error(`Deposit endpoint error: ${error.message}`);
    res.status(500).json({ error: "Erreur serveur lors du dépôt" });
  }
});

/**
 * Endpoint pour vérifier le statut d'un dépôt
 */
router.get("/deposit/:txId", auth, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.txId);
    
    if (!tx || tx.userId !== req.userId) {
      return res.status(404).json({ error: "Transaction non trouvée" });
    }

    res.json({
      txId: tx._id,
      status: tx.status,
      amount: tx.amount,
      type: tx.type,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt
    });
  } catch (error) {
    logger.error(`Deposit status check error: ${error.message}`);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
