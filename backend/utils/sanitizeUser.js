// utils/sanitizeUser.js

/**
 * Rimuove i campi sensibili dall'oggetto utente prima di inviarlo al client.
 * Questo centralizza la logica di "data scrubbing" ed evita violazioni del principio DRY.
 * 
 * Se domani si aggiungono nuovi campi sensibili (es. privateEmail, twoFactorSecret),
 * basta modificare l'array SENSITIVE_FIELDS in questo unico punto.
 * 
 * @param {Object} user - L'oggetto utente dal database
 * @returns {Object} L'oggetto utente senza campi sensibili
 */
function sanitizeUserData(user) {
    if (!user) return null;

    // Lista centralizzata di campi sensibili da rimuovere
    const SENSITIVE_FIELDS = ['passwordHash', 'refreshToken'];

    const sanitized = { ...user };
    SENSITIVE_FIELDS.forEach(field => {
        delete sanitized[field];
    });

    return sanitized;
}

module.exports = { sanitizeUserData };
