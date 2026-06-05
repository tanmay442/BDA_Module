const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'bda'],
      default: 'bda',
    },
    department: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.clerkId;
    delete ret.__v;
    return ret;
  },
});
userSchema.set('toObject', {
  transform: (_doc, ret) => {
    delete ret.clerkId;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
