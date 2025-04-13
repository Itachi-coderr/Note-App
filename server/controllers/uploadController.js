const { cloudinary } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

cloudinary.config(cloudinaryConfig);

// Verify Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary credentials in environment variables');
  process.exit(1);
}

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'note-app',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 2000, crop: "limit" }],
    max_bytes: 20 * 1024 * 1024
  }
});

// Configure multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Export multer middleware
exports.upload = upload;

// Upload image controller
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the secure URL (HTTPS)
    const secureUrl = req.file.path.replace('http://', 'https://');

    res.json({
      url: secureUrl,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to upload image',
      error: error.toString()
    });
  }
};

// Delete image controller
exports.deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ message: 'No image ID provided' });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    res.json({ message: 'Image deleted successfully', result });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to delete image',
      error: error.toString()
    });
  }
}; 