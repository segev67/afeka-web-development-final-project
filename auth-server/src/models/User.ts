/**
 * User Model - Mongoose Schema
 * Defines the User schema for MongoDB with password hashing.
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// ===========================================
// TYPESCRIPT INTERFACE
// ===========================================

/**
 * IUser Interface
 * Defines the TypeScript type for User documents.
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ===========================================
// MONGOOSE SCHEMA DEFINITION
// ===========================================

/**
 * User Schema
 * Defines the structure and validation rules for user documents.
 */
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ===========================================
// PRE-SAVE MIDDLEWARE (PASSWORD HASHING)
// ===========================================

/**
 * Pre-Save Hook - Password Hashing with bcrypt
 *
 * Automatically hashes passwords before saving to database.
 * - Salt rounds: 10 (cryptographically secure balance)
 * - Only hashes if password was modified
 * - Never stores plain text passwords
 */
userSchema.pre('save', async function () {
  // Only hash password if it's new or modified
  if (!this.isModified('password')) {
    return;
  }

  // Generate salt and hash password
  const SALT_ROUNDS = 10;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// ===========================================
// INSTANCE METHODS
// ===========================================

/**
 * Compare Password Method
 * Used during login to verify user's password against stored hash.
 * Returns true if passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ===========================================
// MODEL EXPORT
// ===========================================

const User = mongoose.model<IUser>('User', userSchema);

export default User;
