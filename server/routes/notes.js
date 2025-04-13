const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  shareNote,
  getNoteVersions
} = require('../controllers/noteController');

// Create a new note
router.post('/', auth, createNote);

// Get all notes (including shared)
router.get('/', auth, getNotes);

// Get a single note
router.get('/:id', auth, getNote);

// Update a note
router.put('/:id', auth, updateNote);

// Delete a note
router.delete('/:id', auth, deleteNote);

// Share a note
router.post('/:id/share', auth, shareNote);

// Get note versions
router.get('/:id/versions', auth, getNoteVersions);

module.exports = router; 