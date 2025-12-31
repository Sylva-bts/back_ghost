const express = require("express");
const router = express.Router();
const axios = require("axios");
const Transaction = require("../models/Transaction");
const auth = require("../middlewares/auth");

router.post("/deposit", auth, async (req, res) => {

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount < 5) {
    return res.status(400).json({ error: "Montant invalide. Dépôt minimum 5€" });
  }

  // 1️⃣ Transaction interne
  const tx = await Transaction.create({
    userId: req.userId,
    type: "deposit",
    amount
  });

  // 2️⃣ Paiement OxaPay
  try {
    const oxa = await axios.post(
      "https://api.oxapay.com/merchants/request",
      {
        amount,
        currency: "USD",
        orderId: tx._id.toString(),
        callbackUrl: "https://ton-backend.com/api/webhook/oxapay",
        description: "Depot casino"
      },
      {
        headers: {
          Authorization: process.env.OXAPAY_API_KEY
        },
        timeout: 10000
      }
    );

    tx.oxapayTrackId = oxa.data.trackId;
    await tx.save();

    res.json({ payUrl: oxa.data.payLink });
  } catch (error) {
    // Mark transaction as failed and persist
    tx.status = "failed";
    await tx.save();
    console.error("OxaPay error:", error && error.message ? error.message : error);
    return res.status(502).json({ error: "Erreur lors de la création du paiement" });
  }
});

module.exports = router;