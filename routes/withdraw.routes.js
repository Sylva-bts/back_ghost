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
      return res.status(400).json({ error: "Montant invalide (1-5000 USD)" });
    }

    if (!address || typeof address !== 'string' || address.length < 20 || address.length > 100) {
      return res.status(400).json({ error: "Adresse invalide" });
    }

    if (network && !['TRC20', 'ERC20', 'BEP20'].includes(network.toUpperCase())) {
      return res.status(400).json({ error: "Réseau invalide" });
    }

    const user = await User.findById(req.userId);
    if (user.balance < numAmount) {
      return res.status(400).json({ error: "Solde insuffisant" });
    }

    // 1️⃣ Créer transaction (sans débiter encore)
    const tx = await Transaction.create({
      userId: req.userId,
      type: "withdraw",
      amount: numAmount,
      status: "pending"
    });

    // 2️⃣ Appel OxaPay payout
    const url = "https://api.oxapay.com/v1/payout";
    const data = {
      address: address,
      amount: numAmount,
      currency: "TRX",
      network: network || "TRC20",
      callback_url: `${process.env.BASE_URL}/api/webhook/oxapay`,
      memo: tx._id.toString(),
      description: `Withdraw ${tx._id}`
    };

    const headers = {
      payout_api_key: process.env.OXAPAY_PAYOUT_API_KEY,
      "Content-Type": "application/json"
    };

    const oxa = await axios.post(url, data, { headers });

    if (!oxa.data || oxa.data.result !== true) {
      throw new Error("OxaPay payout failed");
    }

    // 3️⃣ Sauvegarde du track_id
    tx.oxapayTrackId = oxa.data.track_id;
    await tx.save();

    res.json({ message: "Withdrawal requested", txId: tx._id });

  } catch (error) {
    console.error("Withdraw error:", error.response?.data || error.message);
    res.status(500).json({ error: "Erreur lors du retrait" });
  }
});
module.exports = router;