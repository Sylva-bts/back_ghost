const express = require("express");
const router = express.Router();
const axios = require("axios");
const Transaction = require("../models/Transaction");
const auth = require("../middlewares/auth");

router.post("/deposit", auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (amount < 1) {
      return res.status(400).json({ error: "Dépôt minimum 1 USD" });
    }

    // 1️⃣ Transaction interne
    const tx = await Transaction.create({
      userId: req.userId,
      type: "deposit",
      amount
    });

    // 2️⃣ Paiement OxaPay
    const oxa = await axios.post(
      "https://api.oxapay.com/v1/payment/invoice",
      {
        amount,
        currency: "USD",
        lifetime: 30,
        fee_paid_by_payer: 1,
        under_paid_coverage: 2.5,
        to_currency: "USDT",
        auto_withdrawal: false,
        mixed_payment: true,
        callback_url: "https://back-ghost-1.onrender.com/api/webhook/oxapay",
        return_url: "https://example.com/success",
        email: "customer@oxapay.com",
        order_id: tx._id.toString(),
        thanks_message: "Thanks message",
        description: "Depot casino",
        sandbox: false
      },
      {
        headers: {
          merchant_api_key: process.env.OXAPAY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    tx.oxapayTrackId = oxa.data.trackId;
    await tx.save();

    res.json({ payUrl: oxa.data.payLink });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({ error: "Erreur lors du dépôt" });
  }
});

module.exports = router;