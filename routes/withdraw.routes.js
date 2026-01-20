const express = require("express");
const router = express.Router();
const axios = require("axios");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middlewares/auth");
const logger = require("../middlewares/logger");
const { paymentLimiter } = require("../middlewares/rateLimiter");

router.post("/withdraw", paymentLimiter, auth, async (req, res) => {
  try {
    const { amount, address, network } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 1 || numAmount > 5000) {
      logger.warn(`Invalid withdrawal amount: ${amount} by user ${req.userId}`);
      return res.status(400).json({ error: "Montant invalide (1-5000 USD)" });
    }

    if (!address || typeof address !== 'string' || address.length < 20 || address.length > 100) {
      logger.warn(`Invalid withdrawal address: ${address} by user ${req.userId}`);
      return res.status(400).json({ error: "Adresse invalide" });
    }

    if (network && !['TRC20', 'ERC20', 'BEP20'].includes(network.toUpperCase())) {
      logger.warn(`Invalid network: ${network} by user ${req.userId}`);
      return res.status(400).json({ error: "Réseau invalide" });
    }

    const user = await User.findById(req.userId);
    if (user.balance < numAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create transaction
    const tx = await Transaction.create({
      userId: req.userId,
      type: "withdraw",
      amount: numAmount,
      status: "pending"
    });

    // Deduct balance immediately
    user.balance -= numAmount;
    await user.save();

    // 2️⃣ OxaPay payout
    const url = 'https://api.oxapay.com/v1/payout';
    const data = {
      address: address,
      amount: numAmount,
      currency: "TRX",
      network: network || "TRC20",
      callback_url: "https://back-ghost-1.onrender.com/api/webhook/oxapay",
      memo: tx._id.toString(),
      description: "Order #12345"
    };
    const headers = {
      payout_api_key: process.env.OXAPAY_PAYOUT_API_KEY,
      'Content-Type': 'application/json'
    };

    const oxa = await axios.post(url, data, { headers });

    tx.oxapayTrackId = oxa.data.trackId;
    await tx.save();

    res.json({ message: "Withdrawal requested", txId: tx._id });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ error: "Erreur lors du retrait" });
  }
});

module.exports = router;
