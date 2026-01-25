const xss = require('xss');

// Opzioni personalizzate per XSS (più restrittive)
const xssOptions = {
    whiteList: {}, // Non permette nessun tag HTML
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
};

/**
 * Sanitizza una stringa rimuovendo potenziali payload XSS
 * @param {string} input - Stringa da sanitizzare
 * @returns {string} - Stringa sanitizzata
 */
function sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return xss(input, xssOptions);
}

/**
 * Sanitizza ricorsivamente un oggetto
 * @param {any} obj - Oggetto da sanitizzare
 * @returns {any} - Oggetto sanitizzato
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }

    return obj;
}

/**
 * Middleware Express per sanitizzare automaticamente req.body, req.query e req.params
 */
function sanitizeInputMiddleware(req, res, next) {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
}

module.exports = {
    sanitizeString,
    sanitizeObject,
    sanitizeInputMiddleware
};
