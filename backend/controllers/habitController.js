const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// @route POST /api/habits
const createHabit = async (req, res) => {
  try {
    const { name, frequency } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const habit = await Habit.create({ userId: req.userId, name, frequency });
    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create habit', error: err.message });
  }
};

// @route GET /api/habits
const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch habits', error: err.message });
  }
};

// @route DELETE /api/habits/:id
const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    await HabitLog.deleteMany({ habitId: habit._id });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete habit', error: err.message });
  }
};

// @route POST /api/habits/:id/checkin
// Body: { date } -- defaults to today, format YYYY-MM-DD
const checkIn = async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);

    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    // Toggle: if a log already exists for this date, remove it (undo check-in)
    const existing = await HabitLog.findOne({ habitId: habit._id, date });
    if (existing) {
      await existing.deleteOne();
      return res.json({ message: 'Check-in removed', checked: false, date });
    }

    await HabitLog.create({ habitId: habit._id, userId: req.userId, date });
    res.status(201).json({ message: 'Checked in', checked: true, date });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check in', error: err.message });
  }
};

// @route GET /api/habits/:id/logs
const getLogs = async (req, res) => {
  try {
    const logs = await HabitLog.find({ habitId: req.params.id, userId: req.userId }).sort({
      date: 1,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
};

// @route GET /api/habits/:id/streak
// Returns current streak and longest streak, computed from consecutive
// daily logs ending at (or including) today.
const getStreak = async (req, res) => {
  try {
    const logs = await HabitLog.find({ habitId: req.params.id, userId: req.userId }).sort({
      date: 1,
    });

    const dates = logs.map((l) => l.date).sort();
    if (dates.length === 0) {
      return res.json({ currentStreak: 0, longestStreak: 0 });
    }

    let longestStreak = 1;
    let running = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        running += 1;
      } else if (diffDays > 1) {
        running = 1;
      }
      longestStreak = Math.max(longestStreak, running);
    }

    // Current streak: count backwards from today (or yesterday, so a
    // missed "today" doesn't zero out an otherwise-live streak)
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateSet = new Set(dates);
    let currentStreak = 0;
    let cursor = new Date();

    if (!dateSet.has(todayStr)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (dateSet.has(cursor.toISOString().slice(0, 10))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    res.json({ currentStreak, longestStreak });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute streak', error: err.message });
  }
};

module.exports = { createHabit, getHabits, deleteHabit, checkIn, getLogs, getStreak };
