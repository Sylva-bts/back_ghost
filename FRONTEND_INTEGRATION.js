/**
 * GUIDE D'INTÉGRATION FRONTEND
 * Comment appeler les endpoints depuis votre React/Vue/Angular
 */

// ============================================================
// 1. CONFIGURATION INITIALE
// ============================================================

// Dans votre fichier de configuration:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const API_KEY = localStorage.getItem('jwtToken');

// Helper pour les requêtes authentifiées:
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers
    }
  });

  if (response.status === 401) {
    // Token expiré, rediriger vers login
    localStorage.removeItem('jwtToken');
    window.location.href = '/login';
  }

  return response.json();
}

// ============================================================
// 2. AUTHENTIFICATION
// ============================================================

// Register
async function register(username, email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return response.json();
}

// Login
async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (data.token) {
    localStorage.setItem('jwtToken', data.token);
  }
  return data;
}

// ============================================================
// 3. DÉPÔTS
// ============================================================

// Créer un dépôt
async function createDeposit(amount) {
  try {
    const data = await apiCall('/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });

    if (data.success) {
      // Rediriger vers la page de paiement OxaPay
      window.location.href = data.payUrl;
      
      // Sauvegarder le trackId pour suivi
      sessionStorage.setItem('depositTrackId', data.trackId);
      sessionStorage.setItem('depositTxId', data.txId);
    }
    return data;
  } catch (error) {
    console.error('Erreur lors du dépôt:', error);
    throw error;
  }
}

// Vérifier le statut d'un dépôt
async function checkDepositStatus(txId) {
  return await apiCall(`/deposit/${txId}`);
}

// Component React Example:
function DepositForm() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createDeposit(Number(amount));
      // L'utilisateur sera redirigé vers OxaPay
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleDeposit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="1"
        max="10000"
        placeholder="Montant (1-10000 USD)"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Traitement...' : 'Déposer'}
      </button>
    </form>
  );
}

// ============================================================
// 4. RETRAITS
// ============================================================

// Demander un retrait
async function requestWithdraw(amount, address, network = 'TRC20') {
  try {
    const data = await apiCall('/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, address, network })
    });

    if (data.message) {
      // Sauvegarder le trackId pour suivi
      sessionStorage.setItem('withdrawTrackId', data.trackId);
      sessionStorage.setItem('withdrawTxId', data.txId);
    }
    return data;
  } catch (error) {
    console.error('Erreur lors du retrait:', error);
    throw error;
  }
}

// Vérifier le statut d'un retrait
async function checkWithdrawStatus(txId) {
  return await apiCall(`/withdraw/${txId}/status`);
}

// Component React Example:
function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('TRC20');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await requestWithdraw(Number(amount), address, network);
      
      // Afficher le trackId à l'utilisateur
      alert(`Retrait demandé! Numéro de suivi: ${result.trackId}`);
      
      setAmount('');
      setAddress('');
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleWithdraw}>
      <select value={network} onChange={(e) => setNetwork(e.target.value)}>
        <option value="TRC20">TRC20 (TRON)</option>
        <option value="ERC20">ERC20 (Ethereum)</option>
        <option value="BEP20">BEP20 (BSC)</option>
      </select>

      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Adresse de réception"
        required
      />

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="1"
        max="5000"
        placeholder="Montant (1-5000)"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Traitement...' : 'Retirer'}
      </button>
    </form>
  );
}

// ============================================================
// 5. SUIVI DES TRANSACTIONS
// ============================================================

// Hook React pour surveiller le statut
function useTransactionStatus(txId, pollInterval = 5000) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!txId) return;

    const checkStatus = async () => {
      try {
        setLoading(true);
        const data = await checkDepositStatus(txId);
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // Poll tous les N secondes
    const interval = setInterval(checkStatus, pollInterval);
    return () => clearInterval(interval);
  }, [txId, pollInterval]);

  return { status, loading, error };
}

// ============================================================
// 6. GESTION DES ERREURS
// ============================================================

// Intercepteur pour gérer les erreurs courantes
async function safeApiCall(endpoint, options = {}) {
  try {
    const data = await apiCall(endpoint, options);

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    // Traiter les erreurs courantes
    if (error.message.includes('Montant invalide')) {
      throw new Error('Le montant doit être entre 1 et 10000');
    }
    if (error.message.includes('Adresse invalide')) {
      throw new Error('L\'adresse de retrait est invalide');
    }
    if (error.message.includes('Solde insuffisant')) {
      throw new Error('Vous n\'avez pas assez de solde');
    }
    if (error.message.includes('Authentification')) {
      // Rediriger vers login
      window.location.href = '/login';
    }

    throw error;
  }
}

// ============================================================
// 7. NOTIFICATIONS EN TEMPS RÉEL (Optional - WebSocket)
// ============================================================

// Implémenter avec Socket.io pour les mises à jour en temps réel
function useTransactionSocket(txId) {
  useEffect(() => {
    const socket = io(API_URL);

    socket.on('transaction-update', (data) => {
      if (data.txId === txId) {
        // Mettre à jour l'état
        console.log('Transaction mise à jour:', data);
      }
    });

    return () => socket.disconnect();
  }, [txId]);
}

// ============================================================
// 8. EXEMPLE COMPLET D'UNE PAGE DE PAIEMENT
// ============================================================

import React, { useState } from 'react';

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState('deposit');
  const [userBalance, setUserBalance] = useState(0);

  return (
    <div className="payment-container">
      <div className="balance-card">
        <h2>Solde: ${userBalance.toFixed(2)}</h2>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'deposit' ? 'active' : ''}
          onClick={() => setActiveTab('deposit')}
        >
          Déposer
        </button>
        <button 
          className={activeTab === 'withdraw' ? 'active' : ''}
          onClick={() => setActiveTab('withdraw')}
        >
          Retirer
        </button>
      </div>

      {activeTab === 'deposit' && <DepositForm />}
      {activeTab === 'withdraw' && <WithdrawForm />}
    </div>
  );
}

// ============================================================
// 📝 VARIABLES D'ENVIRONNEMENT (.env.local)
// ============================================================

/*
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_FRONT_URL=http://localhost:3000
*/

// Pour production:
/*
REACT_APP_API_URL=https://api.escapeghost.com/api
REACT_APP_FRONT_URL=https://escapeghost.netlify.app
*/

console.log('✅ Guide d\'intégration frontend complet!');
