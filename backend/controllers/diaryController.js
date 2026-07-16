const DiaryEntry = require('../models/DiaryEntry');

// @route POST /api/diary
// Body: { ciphertext, iv, entryDate? }
const createEntry = async (req, res) => {
  try {
    const { ciphertext, iv, entryDate } = req.body;

    if (!ciphertext || !iv) {
      return res.status(400).json({ message: 'ciphertext and iv are required' });
    }

    const entry = await DiaryEntry.create({
      userId: req.userId,
      ciphertext,
      iv,
      entryDate: entryDate || Date.now(),
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create entry', error: err.message });
  }
};

// @route GET /api/diary
const getEntries = async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ userId: req.userId }).sort({ entryDate: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch entries', error: err.message });
  }
};

// @route DELETE /api/diary/:id
const deleteEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete entry', error: err.message });
  }
};

module.exports = { createEntry, getEntries, deleteEntry };
