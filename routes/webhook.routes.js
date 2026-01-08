const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const logger = require("../middlewares/logger");

// Set to track processed webhooks
const processedWebhooks = new Set();

router.post("/oxapay", async (req, res) => {
  try {
    const { track_id, status, amount } = req.body;
    const trackId = track_id;

    if (!trackId) {
      return res.status(400).json({ error: "Missing track_id" });
    }

    const tx = await Transaction.findOne({ oxapayTrackId: trackId });
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    // ⛔ Empêche le double traitement
    if (tx.status === "completed") {
      return res.json({ message: "Already processed" });
    }

    // Vérifie le montant payé
    if (Number(amount) < tx.amount) {
      tx.status = "failed";
      await tx.save();
      return res.status(400).json({ error: "Underpaid transaction" });
    }

    if (tx.type === "deposit") {
      if (status === "paid" || status === "Paid") {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          await User.findByIdAndUpdate(
            tx.userId,
            { $inc: { balance: tx.amount } },
            { session }
          );

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
    }

    else if (tx.type === "withdraw") {
      if (status === "paid" || status === "Paid") {
        tx.status = "completed";
        await tx.save();
      } else {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          await User.findByIdAndUpdate(
            tx.userId,
            { $inc: { balance: tx.amount } },
            { session }
          );

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

    logger.info(`Webhook processed successfully for trackId: ${trackId}, status: ${status}`);
    res.json({ message: "Webhook processed" });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});
