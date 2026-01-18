const axios = require('axios');
const logger = require('../middlewares/logger');

const OXAPAY_API_URL = 'https://api.oxapay.com/v1';

class OxapayService {
  constructor() {
    this.apiKey = process.env.OXAPAY_PAYOUT_API_KEY;
    this.merchantId = process.env.OXAPAY_MERCHANT;
  }

  /**
   * Effectuer un payout (retrait)
   * @param {Object} payoutData - Les données du payout
   * @param {string} payoutData.address - Adresse de réception
   * @param {number} payoutData.amount - Montant à envoyer
   * @param {string} payoutData.currency - Devise (TRX, BTC, ETH, etc.)
   * @param {string} payoutData.network - Réseau (TRC20, ERC20, BEP20)
   * @param {string} payoutData.memo - Référence interne/ID transaction
   * @param {string} payoutData.description - Description
   * @returns {Promise<Object>} Réponse d'OxaPay
   */
  async createPayout(payoutData) {
    try {
      const payload = {
        address: payoutData.address,
        amount: payoutData.amount,
        currency: payoutData.currency || 'TRX',
        network: payoutData.network || 'TRC20',
        memo: payoutData.memo,
        description: payoutData.description,
        callback_url: process.env.OXAPAY_CALLBACK_URL || 'https://back-ghost-1.onrender.com/api/webhook/oxapay'
      };

      const headers = {
        'payout_api_key': this.apiKey,
        'Content-Type': 'application/json'
      };

      logger.info(`Creating OxaPay payout for amount: ${payoutData.amount} ${payoutData.currency}`);

      const response = await axios.post(`${OXAPAY_API_URL}/payout`, payload, { headers });

      logger.info(`OxaPay payout successful. TrackId: ${response.data.trackId}`);
      return response.data;
    } catch (error) {
      logger.error(`OxaPay payout failed: ${error.message}`);
      throw new Error(`OxaPay Error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Vérifier le statut d'un payout
   * @param {string} trackId - ID de suivi OxaPay
   * @returns {Promise<Object>} Statut du payout
   */
  async getPayoutStatus(trackId) {
    try {
      const headers = {
        'payout_api_key': this.apiKey,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(`${OXAPAY_API_URL}/payout/${trackId}`, { headers });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get payout status: ${error.message}`);
      throw new Error(`OxaPay Status Check Error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Valider les données d'un payout
   * @param {Object} payoutData - Les données du payout
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  validatePayout(payoutData) {
    if (!payoutData.address || typeof payoutData.address !== 'string') {
      return { isValid: false, error: 'Adresse invalide' };
    }

    if (payoutData.address.length < 20 || payoutData.address.length > 100) {
      return { isValid: false, error: 'Format d\'adresse invalide' };
    }

    const amount = Number(payoutData.amount);
    if (isNaN(amount) || amount < 1 || amount > 5000) {
      return { isValid: false, error: 'Montant invalide (1-5000)' };
    }

    const validNetworks = ['TRC20', 'ERC20', 'BEP20'];
    if (payoutData.network && !validNetworks.includes(payoutData.network.toUpperCase())) {
      return { isValid: false, error: 'Réseau invalide' };
    }

    return { isValid: true, error: null };
  }
}

module.exports = new OxapayService();
