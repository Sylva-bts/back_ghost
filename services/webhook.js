const logger = require('../middlewares/logger');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Service pour gérer les webhooks OxaPay
 * Traite les notifications de paiement/retrait
 */
class WebhookService {
  constructor() {
    // Set pour tracker les webhooks traités (évite les doublons)
    this.processedWebhooks = new Set();
  }

  /**
   * Traiter un webhook OxaPay
   * @param {Object} webhookData - Les données du webhook
   * @returns {Promise<Object>} Résultat du traitement
   */
  async processWebhook(webhookData) {
    const { trackId, status, type, amount } = webhookData;

    // Vérifier si le webhook a déjà été traité
    if (this.processedWebhooks.has(trackId)) {
      logger.warn(`Webhook already processed: ${trackId}`);
      return { processed: true, cached: true };
    }

    // Trouver la transaction
    const tx = await Transaction.findOne({ oxapayTrackId: trackId });
    if (!tx) {
      logger.error(`Transaction not found for trackId: ${trackId}`);
      throw new Error('Transaction not found');
    }

    // Démarrer une session MongoDB pour les transactions ACID
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (tx.type === 'deposit') {
        await this.handleDepositWebhook(tx, status, session);
      } else if (tx.type === 'withdraw') {
        await this.handleWithdrawWebhook(tx, status, session);
      }

      // Sauvegarder les changements
      await tx.save({ session });
      await session.commitTransaction();

      // Marquer comme traité
      this.processedWebhooks.add(trackId);
      this.cleanupOldWebhooks();

      logger.info(`Webhook processed successfully: trackId=${trackId}, status=${status}, type=${tx.type}`);
      return { processed: true, status: tx.status };
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Webhook processing failed for ${trackId}: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Traiter un webhook de dépôt
   * @private
   */
  async handleDepositWebhook(tx, status, session) {
    const statusMap = {
      paid: 'completed',
      pending: 'processing',
      failed: 'failed',
      cancelled: 'failed'
    };

    const newStatus = statusMap[status] || 'failed';

    if (newStatus === 'completed') {
      // Ajouter le montant au solde de l'utilisateur
      await User.findByIdAndUpdate(
        tx.userId,
        { $inc: { balance: tx.amount } },
        { session }
      );
      
      tx.status = 'completed';
      logger.info(`Deposit completed: userId=${tx.userId}, amount=${tx.amount}`);
    } else if (newStatus === 'failed') {
      // Si le dépôt échoue, on le marque simplement comme échoué
      tx.status = 'failed';
      logger.warn(`Deposit failed: userId=${tx.userId}, trackId=${tx.oxapayTrackId}`);
    } else {
      tx.status = 'processing';
    }
  }

  /**
   * Traiter un webhook de retrait
   * @private
   */
  async handleWithdrawWebhook(tx, status, session) {
    const statusMap = {
      paid: 'completed',
      pending: 'processing',
      failed: 'failed',
      cancelled: 'failed'
    };

    const newStatus = statusMap[status] || 'failed';

    if (newStatus === 'completed') {
      // Le retrait a réussi - le solde a déjà été déduit lors de la demande
      tx.status = 'completed';
      logger.info(`Withdrawal completed: userId=${tx.userId}, amount=${tx.amount}`);
    } else if (newStatus === 'failed') {
      // Si le retrait échoue, rembourser l'utilisateur
      await User.findByIdAndUpdate(
        tx.userId,
        { $inc: { balance: tx.amount } },
        { session }
      );
      
      tx.status = 'failed';
      logger.warn(`Withdrawal failed and refunded: userId=${tx.userId}, amount=${tx.amount}`);
    } else {
      tx.status = 'processing';
    }
  }

  /**
   * Nettoyer les anciens webhooks traités
   * Garder seulement les 1000 derniers pour éviter une fuite mémoire
   * @private
   */
  cleanupOldWebhooks() {
    if (this.processedWebhooks.size > 1000) {
      const iterator = this.processedWebhooks.values();
      for (let i = 0; i < 100; i++) {
        const first = iterator.next().value;
        this.processedWebhooks.delete(first);
      }
      logger.debug(`Cleaned up processed webhooks. Remaining: ${this.processedWebhooks.size}`);
    }
  }

  /**
   * Vérifier si un webhook a déjà été traité
   */
  isWebhookProcessed(trackId) {
    return this.processedWebhooks.has(trackId);
  }

  /**
   * Obtenir le statut d'une transaction par trackId
   */
  async getTransactionStatus(trackId) {
    const tx = await Transaction.findOne({ oxapayTrackId: trackId });
    if (!tx) {
      throw new Error('Transaction not found');
    }
    return {
      txId: tx._id,
      type: tx.type,
      status: tx.status,
      amount: tx.amount,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt
    };
  }
}

module.exports = new WebhookService();
