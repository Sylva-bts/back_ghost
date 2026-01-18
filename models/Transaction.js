const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["deposit", "withdraw"], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  network: { type: String, default: null }, // Pour les retraits (TRC20, ERC20, BEP20)
  address: { type: String, default: null }, // Adresse de retrait
  oxapayTrackId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  errorMessage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexation pour améliorer les performances
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ oxapayTrackId: 1 });
transactionSchema.index({ status: 1 });

// Mettre à jour updatedAt avant chaque sauvegarde
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
