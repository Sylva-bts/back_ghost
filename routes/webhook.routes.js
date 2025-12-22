const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const User = require("../models/User");

router.post("/oxapay", async (req, res) => {
  const { trackId, status, amount } = req.body;

  // Find transaction
  const tx = await Transaction.findOne({ oxapayTrackId: trackId });
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  if (status === "paid") {
    // Update user balance
    await User.findByIdAndUpdate(tx.userId, { $inc: { balance: tx.amount } });
    tx.status = "completed";
  } else {
    tx.status = "failed";
  }

  await tx.save();
  res.json({ message: "Webhook processed" });
});

module.exports = router;
