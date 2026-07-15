const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // Salt used on the CLIENT to derive the AES encryption key from the
    // user's password (PBKDF2). This is not secret — it just needs to be
    // consistent per user so the same key can be re-derived on every login.
    // The server never sees the derived key itself.
    encryptionSalt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
