// middleware/uploadAvatar.js
const multer = require('multer');
const path = require('path');

// Configurazione storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        // Nome file: userId-timestamp.estensione
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${req.id}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

// Filtro per accettare solo jpg e png
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato file non supportato. Usa solo JPG o PNG.'), false);
    }
};

// Configurazione multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

module.exports = upload;
