const express = require('express');
const protect = require('../middleware/authMiddleware');
const { createEntry, getEntries, deleteEntry } = require('../controllers/diaryController');

const router = express.Router();

router.use(protect);

router.post('/', createEntry);
router.get('/', getEntries);
router.delete('/:id', deleteEntry);

module.exports = router;
