import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const uid = { type: Schema.Types.ObjectId, index: true, required: true };
export const User = model('User', new Schema({
  name: String, email: { type: String, unique: true, lowercase: true, trim: true }, passwordHash: String
}, { timestamps: true }));
export const Resume = model('Resume', new Schema({
  userId: uid, fileName: String, fileUrl: String, text: String, analysis: Schema.Types.Mixed
}, { timestamps: true }));
// Saved jobs + application tracker live in one collection: status moves saved -> applied -> interview -> offer/rejected
export const Tracked = model('Tracked', new Schema({
  userId: uid, externalId: String, job: Schema.Types.Mixed, match: Schema.Types.Mixed, notes: String,
  status: { type: String, enum: ['saved', 'applied', 'interview', 'offer', 'rejected'], default: 'saved' }
}, { timestamps: true }));
