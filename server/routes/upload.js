const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { uploadImage, deleteImage } = require('../controllers/uploadController');

// Upload route
router.post('/image', auth, upload.single('image'), uploadImage);

// Delete route
router.delete('/image', auth, deleteImage);

module.exports = router; 