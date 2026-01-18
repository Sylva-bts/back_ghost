/**
 * Classes d'erreurs personnalisées pour l'application
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentification requise') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Accès non autorisé') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class PaymentError extends AppError {
  constructor(message, statusCode = 500) {
    super(message, statusCode);
    this.name = 'PaymentError';
  }
}

class InsufficientBalanceError extends AppError {
  constructor(message = 'Solde insuffisant') {
    super(message, 400);
    this.name = 'InsufficientBalanceError';
  }
}

class OxaPayError extends PaymentError {
  constructor(message, originalError = null) {
    super(`Erreur OxaPay: ${message}`, 502);
    this.name = 'OxaPayError';
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  PaymentError,
  InsufficientBalanceError,
  OxaPayError
};
