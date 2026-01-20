const express = require("express");
const router = express.Router();
const axios = require("axios");
const Transaction = require("../models/Transaction");
const auth = require("../middlewares/auth");
const logger = require("../middlewares/logger");
const { paymentLimiter } = require("../middlewares/rateLimiter");

router.post("/deposit", paymentLimiter, auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (isNaN(amount) || amount < 1 || amount > 10000) {
      logger.warn(`Invalid deposit amount: ${req.body.amount} by user ${req.userId}`);
      return res.status(400).json({ error: "Montant invalide (1-10000 USD)" });
    }

    const tx = await Transaction.create({
      userId: req.userId,
      type: "deposit",
      amount
    });

    const oxa = await axios.post(
      "https://api.oxapay.com/v1/payment/invoice",
      {
        merchant: process.env.OXAPAY_API_KEY,
        amount,
        currency: "USD",
        lifetime: 30,
        fee_paid_by_payer: 1,
        under_paid_coverage: 2.5,
        to_currency: "USDT",
        auto_withdrawal: false,
        mixed_payment: true,
        callback_url: "https://back-ghost-1.onrender.com/api/webhook/oxapay",
        return_url: "https://escapeghost.netlify.app",
        email: "customer@oxapay.com",
        order_id: tx._id.toString(),
        thanks_message: "Thanks message",
        description: "Depot casino",
        sandbox: true   // 🔁 mode test
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    tx.oxapayTrackId = oxa.data.track_id;
    await tx.save();

    res.json({ payUrl: oxa.data.pay_link });
  } catch (error) {
    console.error("Deposit error:", error.response?.data || error.message);
    res.status(500).json({ error: "Erreur lors du dépôt" });
  }
});
