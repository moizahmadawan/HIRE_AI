import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes.js';

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) throw new Error('Set MONGODB_URI and JWT_SECRET in .env');
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120 }), router);
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public')));
app.use((err, req, res, next) => {
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong. Please try again.' : err.message });
});
await mongoose.connect(process.env.MONGODB_URI);
app.listen(process.env.PORT || 5000, () => console.log('App running on port ' + (process.env.PORT || 5000)));
