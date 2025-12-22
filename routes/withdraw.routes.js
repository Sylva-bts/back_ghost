const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const auth = require("../middlewares/auth");

router.post("/withdraw", auth, async (req, res) => {
  const { amount } = req.body;

  const user = await User.findById(req.userId);
  if (user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  // Create transaction
  const tx = await Transaction.create({
    userId: req.userId,
    type: "withdraw",
    amount
  });

  // Deduct balance
  user.balance -= amount;
  await user.save();

  res.json({ message: "Withdrawal requested", txId: tx._id });
});

module.exports = router;
