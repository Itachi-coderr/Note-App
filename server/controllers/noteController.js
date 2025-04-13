const Note = require('../models/Note');

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = new Note({
      title,
      content,
      owner: req.user.id,
      versions: [{ content, modifiedBy: req.user.id }]
    });
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error creating note', error: error.message });
  }
};

// Get all notes for a user (including shared notes)
exports.getNotes = async (req, res) => {
  try {
    const ownedNotes = await Note.find({ owner: req.user.id })
      .sort({ updatedAt: -1 });
    
    const sharedNotes = await Note.find({
      'sharedWith.user': req.user.id
    }).sort({ updatedAt: -1 });

    res.json({
      owned: ownedNotes,
      shared: sharedNotes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
};

// Get a single note by ID
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'sharedWith.user': req.user.id }
      ]
    }).populate('owner', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching note', error: error.message });
  }
};

// Update a note
exports.updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'sharedWith.user': req.user.id, 'sharedWith.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or permission denied' });
    }

    // Add new version
    note.versions.push({
      content: note.content,
      modifiedBy: req.user.id
    });

    // Update note
    note.title = title;
    note.content = content;
    note.lastModified = Date.now();

    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
};

// Share a note with another user
exports.shareNote = async (req, res) => {
  try {
    const { userId, permission } = req.body;
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if already shared
    const existingShare = note.sharedWith.find(
      share => share.user.toString() === userId
    );

    if (existingShare) {
      existingShare.permission = permission;
    } else {
      note.sharedWith.push({ user: userId, permission });
    }

    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error sharing note', error: error.message });
  }
};

// Get note versions
exports.getNoteVersions = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'sharedWith.user': req.user.id }
      ]
    }).select('versions');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note.versions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching versions', error: error.message });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or permission denied' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
}; 