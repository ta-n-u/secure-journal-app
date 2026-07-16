import { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import api from '../api/axios';

export default function Habits() {
  const [habits, setHabits] = useState([]); // { _id, name, frequency, currentStreak, longestStreak }
  const [newHabit, setNewHabit] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);

  const loadHabits = async () => {
    const res = await api.get('/habits');

    const withStreaks = await Promise.all(
      res.data.map(async (habit) => {
        const streakRes = await api.get(`/habits/${habit._id}/streak`);
        return { ...habit, ...streakRes.data };
      })
    );

    setHabits(withStreaks);
    if (!selectedHabitId && withStreaks.length > 0) {
      setSelectedHabitId(withStreaks[0]._id);
    }
  };

  const loadHeatmap = async (habitId) => {
    if (!habitId) return;
    const res = await api.get(`/habits/${habitId}/logs`);
    setHeatmapData(res.data.map((log) => ({ date: log.date, count: 1 })));
  };

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    loadHeatmap(selectedHabitId);
  }, [selectedHabitId]);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    await api.post('/habits', { name: newHabit, frequency: 'daily' });
    setNewHabit('');
    loadHabits();
  };

  const handleCheckIn = async (habitId) => {
    await api.post(`/habits/${habitId}/checkin`);
    await loadHabits();
    if (habitId === selectedHabitId) loadHeatmap(habitId);
  };

  const handleDeleteHabit = async (habitId) => {
    await api.delete(`/habits/${habitId}`);
    if (habitId === selectedHabitId) setSelectedHabitId(null);
    loadHabits();
  };

  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return (
    <div className="habits-page">
      <h2>Habits</h2>

      <form onSubmit={handleAddHabit}>
        <input
          placeholder="New habit (e.g. Read 20 pages)"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
        />
        <button type="submit">Add Habit</button>
      </form>

      <ul className="habit-list">
        {habits.map((habit) => (
          <li key={habit._id} className={habit._id === selectedHabitId ? 'selected' : ''}>
            <span onClick={() => setSelectedHabitId(habit._id)} style={{ cursor: 'pointer' }}>
              <strong>{habit.name}</strong> — streak: {habit.currentStreak} (best:{' '}
              {habit.longestStreak})
            </span>
            <button onClick={() => handleCheckIn(habit._id)}>Check in today</button>
            <button onClick={() => handleDeleteHabit(habit._id)}>Delete</button>
          </li>
        ))}
      </ul>

      {selectedHabitId && (
        <div className="heatmap-wrapper">
          <h3>Consistency</h3>
          <CalendarHeatmap
            startDate={oneYearAgo}
            endDate={today}
            values={heatmapData}
            classForValue={(value) => (!value ? 'color-empty' : 'color-filled')}
          />
        </div>
      )}
    </div>
  );
}
