import { useEffect, useState } from 'react';
import api from '../api/axios';
import { encryptText, decryptText } from '../utils/crypto';
import { useAuth } from '../context/AuthContext';

export default function Diary() {
  const { encryptionKey } = useAuth();
  const [entries, setEntries] = useState([]); // { _id, entryDate, plaintext }
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    setLoading(true);
    const res = await api.get('/diary');

    // Decrypt every entry client-side after fetching ciphertext
    const decrypted = await Promise.all(
      res.data.map(async (entry) => {
        try {
          const plaintext = await decryptText(entry.ciphertext, entry.iv, encryptionKey);
          return { ...entry, plaintext };
        } catch {
          return { ...entry, plaintext: '[Could not decrypt]' };
        }
      })
    );

    setEntries(decrypted);
    setLoading(false);
  };

  useEffect(() => {
    if (encryptionKey) loadEntries();
  }, [encryptionKey]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEntry.trim()) return;

    const { ciphertext, iv } = await encryptText(newEntry, encryptionKey);
    await api.post('/diary', { ciphertext, iv });
    setNewEntry('');
    loadEntries();
  };

  const handleDelete = async (id) => {
    await api.delete(`/diary/${id}`);
    loadEntries();
  };

  if (!encryptionKey) {
    return <p>Session key not available — please log in again to decrypt entries.</p>;
  }

  return (
    <div className="diary-page">
      <h2>Diary</h2>

      <form onSubmit={handleAdd}>
        <textarea
          placeholder="Write today's entry..."
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          rows={4}
        />
        <button type="submit">Save Entry</button>
      </form>

      {loading ? (
        <p>Decrypting entries...</p>
      ) : (
        <ul className="entry-list">
          {entries.map((entry) => (
            <li key={entry._id}>
              <p className="entry-date">{new Date(entry.entryDate).toLocaleDateString()}</p>
              <p>{entry.plaintext}</p>
              <button onClick={() => handleDelete(entry._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
