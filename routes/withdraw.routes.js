const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middlewares/auth");
const logger = require("../middlewares/logger");
const { paymentLimiter } = require("../middlewares/rateLimiter");
const oxapayService = require("../services/oxapay");

router.post("/withdraw", paymentLimiter, auth, async (req, res) => {
  try {
    const { amount, address, network } = req.body;
    const numAmount = Number(amount);

    // Valider les données avec le service OxaPay
    const validation = oxapayService.validatePayout({
      amount: numAmount,
      address,
      network
    });

    if (!validation.isValid) {
      logger.warn(`Invalid withdrawal: ${validation.error} by user ${req.userId}`);
      return res.status(400).json({ error: validation.error });
    }

    // Vérifier le solde de l'utilisateur
    const user = await User.findById(req.userId);
    if (!user || user.balance < numAmount) {
      logger.warn(`Insufficient balance: ${numAmount} by user ${req.userId}`);
      return res.status(400).json({ error: "Solde insuffisant" });
    }

    // Créer la transaction
    const tx = await Transaction.create({
      userId: req.userId,
      type: "withdraw",
      amount: numAmount,
      status: "pending",
      address,
      network: network || "TRC20"
    });

    // Déduire le solde immédiatement
    user.balance -= numAmount;
    await user.save();

    // Effectuer le payout OxaPay
    try {
      const payoutResult = await oxapayService.createPayout({
        address,
        amount: numAmount,
        currency: "TRX",
        network: network || "TRC20",
        memo: tx._id.toString(),
        description: `Retrait utilisateur ${req.userId}`
      });

      // Enregistrer le trackId
      tx.oxapayTrackId = payoutResult.trackId;
      tx.status = "processing";
      await tx.save();

      logger.info(`Withdrawal processed: ${tx._id} for user ${req.userId}`);
      res.json({
        message: "Retrait demandé avec succès",
        txId: tx._id,
        trackId: payoutResult.trackId
      });
    } catch (oxapayError) {
      // En cas d'erreur OxaPay, rembourser l'utilisateur
      logger.error(`OxaPay error for tx ${tx._id}: ${oxapayError.message}`);
      
      user.balance += numAmount; // Remboursement
      await user.save();
      
      tx.status = "failed";
      tx.errorMessage = oxapayError.message;
      await tx.save();

      return res.status(500).json({
        error: "Erreur lors du traitement du retrait",
        details: oxapayError.message
      });
    }
  } catch (error) {
    logger.error(`Withdraw route error: ${error.message}`);
    res.status(500).json({ error: "Erreur serveur lors du retrait" });
  }
});

// Route pour vérifier le statut d'un retrait
router.get("/withdraw/:txId/status", auth, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.txId);
    
    if (!tx || tx.userId !== req.userId) {
      return res.status(404).json({ error: "Transaction non trouvée" });
    }

    if (!tx.oxapayTrackId) {
      return res.status(400).json({ error: "Transaction sans OxaPay trackId" });
    }

    try {
      const status = await oxapayService.getPayoutStatus(tx.oxapayTrackId);
      res.json({
        txId: tx._id,
        status: tx.status,
        oxapayStatus: status,
        amount: tx.amount
      });
    } catch (error) {
      res.status(500).json({
        error: "Impossible de vérifier le statut",
        txStatus: tx.status
      });
    }
  } catch (error) {
    logger.error(`Status check error: ${error.message}`);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
