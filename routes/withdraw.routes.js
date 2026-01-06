const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middlewares/auth");

router.post("/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);

    if (numAmount < 1) {
      return res.status(400).json({ error: "Retrait minimum 1 USD" });
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
      status: "completed"
    });

    // Deduct balance
    user.balance -= numAmount;
    await user.save();

    res.json({ message: "Withdrawal requested", txId: tx._id });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ error: "Erreur lors du retrait" });
  }
});

module.exports = router;
