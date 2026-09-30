import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { User, Resume, Tracked } from './models.js';
import { analyzeCv, matchJob, searchJobs, storeFile, gemini } from './services.js';

export const router = Router();
const bad = (m, status = 400) => Object.assign(new Error(m), { status });
const sign = u => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try { req.uid = jwt.verify((req.headers.authorization || '').slice(7), process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Please log in.' }); }
};
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, f, cb) => f.mimetype === 'application/pdf' ? cb(null, true) : cb(bad('Please upload a PDF file.')) });
const pub = r => r && { id: r.id, fileName: r.fileName, analysis: r.analysis, createdAt: r.createdAt };
const latest = uid => Resume.findOne({ userId: uid }).sort({ createdAt: -1 });

/* Auth */
router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !/^\S+@\S+\.\S+$/.test(String(email || '')) || String(password || '').length < 8) throw bad('Enter a name, a valid email and a password of 8+ characters.');
  if (await User.findOne({ email: String(email) })) throw bad('This email is already registered.', 409);
  const u = await User.create({ name: String(name).slice(0, 60), email: String(email), passwordHash: await bcrypt.hash(String(password), 12) });
  res.json({ token: sign(u), name: u.name });
});
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = await User.findOne({ email: String(email || '') });
  if (!u || !(await bcrypt.compare(String(password || ''), u.passwordHash))) throw bad('Wrong email or password.', 401);
  res.json({ token: sign(u), name: u.name });
});
router.delete('/account', auth, async (req, res) => {
  await Promise.all([Resume.deleteMany({ userId: req.uid }), Tracked.deleteMany({ userId: req.uid }), User.findByIdAndDelete(req.uid)]);
  res.json({ ok: true });
});

/* CV */
router.post('/resumes/upload', auth, upload.single('cv'), async (req, res) => {
  if (!req.file) throw bad('Please upload a PDF file.');
  const text = ((await pdf(req.file.buffer)).text || '').replace(/[ \t]+/g, ' ').trim();
  if (text.length < 80) throw bad('No readable text found. Scanned PDFs are not supported.', 422);
  const [analysis, fileUrl] = await Promise.all([analyzeCv(text), storeFile(req.file.buffer)]);
  res.json(pub(await Resume.create({ userId: req.uid, fileName: req.file.originalname, fileUrl, text, analysis })));
});
router.get('/resumes/latest', auth, async (req, res) => res.json(pub(await latest(req.uid))));
router.delete('/resumes/:id', auth, async (req, res) => { await Resume.deleteOne({ _id: req.params.id, userId: req.uid }); res.json({ ok: true }); });

/* Jobs + AI */
router.get('/jobs', auth, async (req, res) => res.json(await searchJobs(req.query)));
router.post('/ai/match-job', auth, async (req, res) => {
  const r = await latest(req.uid); if (!r) throw bad('Upload your CV first.');
  const j = req.body?.job; if (!j?.title) throw bad('Job data missing.');
  res.json(await matchJob(r.analysis, j));
});
router.post('/ai/improve-cv', auth, async (req, res) => {
  const r = await latest(req.uid); if (!r) throw bad('Upload your CV first.');
  res.json(await gemini(`You are a career coach. Improve this CV${req.body?.targetRole ? ' for the role "' + String(req.body.targetRole).slice(0, 80) + '"' : ''}. Return JSON only: {"weakBullets":[{"original":"","improved":""}],"missingKeywords":[""],"atsTips":[""],"skillsToLearn":[""]}. Max 5 items per list.\nCV:\n${r.text.slice(0, 12000)}`));
});

/* Saved jobs + application tracker */
router.get('/saved', auth, async (req, res) => res.json(await Tracked.find({ userId: req.uid }).sort({ updatedAt: -1 })));
router.post('/saved', auth, async (req, res) => {
  const { job, match } = req.body || {}; if (!job?.id) throw bad('Job data missing.');
  res.json(await Tracked.findOneAndUpdate({ userId: req.uid, externalId: String(job.id) },
    { $set: { job, match: match || null }, $setOnInsert: { status: 'saved' } }, { upsert: true, new: true }));
});
router.patch('/saved/:id', auth, async (req, res) => {
  const set = {}; if (req.body?.status) set.status = String(req.body.status); if (req.body?.notes != null) set.notes = String(req.body.notes).slice(0, 1000);
  const t = await Tracked.findOneAndUpdate({ _id: req.params.id, userId: req.uid }, { $set: set }, { new: true, runValidators: true });
  if (!t) throw bad('Not found.', 404); res.json(t);
});
router.delete('/saved/:id', auth, async (req, res) => { await Tracked.deleteOne({ _id: req.params.id, userId: req.uid }); res.json({ ok: true }); });
