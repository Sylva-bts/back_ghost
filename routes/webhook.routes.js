const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const logger = require("../middlewares/logger");

// Set to track processed webhooks
const processedWebhooks = new Set();

router.post("/oxapay", async (req, res) => {
  const { trackId, status, amount } = req.body;

  // Find transaction
  const tx = await Transaction.findOne({ oxapayTrackId: trackId });
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  if (tx.type === "deposit") {
    if (status === "paid") {
      // Atomic balance update
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await User.findByIdAndUpdate(tx.userId, { $inc: { balance: tx.amount } }, { session });
        tx.status = "completed";
        await tx.save({ session });
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      tx.status = "failed";
      await tx.save();
    }
  } else if (tx.type === "withdraw") {
    if (status === "paid") {
      tx.status = "completed";
      await tx.save();
    } else {
      // Atomic balance refund
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await User.findByIdAndUpdate(tx.userId, { $inc: { balance: tx.amount } }, { session });
        tx.status = "failed";
        await tx.save({ session });
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  }

  await tx.save();

  // Mark as processed
  processedWebhooks.add(trackId);

  // Clean up old entries (keep last 1000)
  if (processedWebhooks.size > 1000) {
    const first = processedWebhooks.values().next().value;
    processedWebhooks.delete(first);
  }

  logger.info(`Webhook processed successfully for trackId: ${trackId}, status: ${status}`);
  res.json({ message: "Webhook processed" });
});

module.exports = router;
