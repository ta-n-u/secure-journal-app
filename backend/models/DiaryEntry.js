const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // AES-GCM ciphertext, produced client-side. The server never sees
    // plaintext and cannot decrypt this on its own.
    ciphertext: {
      type: String,
      required: true,
    },
    // Initialization vector used for this entry's encryption — not secret,
    // but required alongside the key to decrypt.
    iv: {
      type: String,
      required: true,
    },
    entryDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
