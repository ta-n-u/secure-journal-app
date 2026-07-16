const express = require('express');
const protect = require('../middleware/authMiddleware');
const {
  createHabit,
  getHabits,
  deleteHabit,
  checkIn,
  getLogs,
  getStreak,
} = require('../controllers/habitController');

const router = express.Router();

router.use(protect);

router.post('/', createHabit);
router.get('/', getHabits);
router.delete('/:id', deleteHabit);
router.post('/:id/checkin', checkIn);
router.get('/:id/logs', getLogs);
router.get('/:id/streak', getStreak);

module.exports = router;
