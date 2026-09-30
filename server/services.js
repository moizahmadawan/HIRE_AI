import { v2 as cloudinary } from 'cloudinary';

const SKILLS = ['JavaScript','TypeScript','React','Next.js','Vue','Angular','HTML','CSS','Tailwind','Redux','Node.js','Express','PHP','Laravel','Django','Flask','Java','Spring','C#','.NET','C++','Python','REST API','GraphQL','SQL','MySQL','PostgreSQL','MongoDB','Firebase','Redis','Machine Learning','TensorFlow','PyTorch','Pandas','NLP','Flutter','React Native','Kotlin','Swift','Git','Docker','Kubernetes','AWS','Azure','Linux','CI/CD','Agile','Jest','Figma'];
const clamp = n => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const strip = s => String(s || '').replace(/<\/?[^>]+>/g, '');
const fail = (m, status) => Object.assign(new Error(m), { status });

export const findSkills = (text = '') => {
  const t = ' ' + text.toLowerCase().replace(/[^a-z0-9+#.\/]+/g, ' ').replace(/\.(?=\s|$)/g, '') + ' ';
  return SKILLS.filter(s => t.includes(' ' + s.toLowerCase() + ' '));
};

/* Gemini: JSON-only output, always validated by the caller */
export async function gemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw fail('AI is not configured (GEMINI_API_KEY missing).', 503);
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } })
  });
  if (!r.ok) throw fail('CV analysis could not be completed. Please try again.', 502);
  try { return JSON.parse((await r.json()).candidates[0].content.parts[0].text); }
  catch { throw fail('AI returned an unreadable answer. Please try again.', 502); }
}

export async function analyzeCv(text) {
  const a = await gemini(`You are a CV parser. Return JSON only, in exactly this shape: {"name":"","email":"","phone":"","location":"","careerField":"","yearsExperience":0,"education":[{"degree":"","university":"","year":0}],"skills":[""],"experience":[{"title":"","company":"","years":0}],"projects":[""],"certifications":[""],"scores":{"skills":0,"experience":0,"projects":0,"education":0,"keywords":0,"structure":0},"suggestions":[""]}. Scores are 0-100. Give up to 8 specific suggestions. CV text:\n${text.slice(0, 12000)}`);
  const skills = [...new Set([...(Array.isArray(a.skills) ? a.skills : []), ...findSkills(text)].map(String))].slice(0, 60);
  const scores = Object.fromEntries(['skills', 'experience', 'projects', 'education', 'keywords', 'structure'].map(k => [k, clamp(a.scores?.[k])]));
  const cvScore = Math.round(Object.values(scores).reduce((x, y) => x + y, 0) / 6);
  return { ...a, skills, scores, cvScore, suggestions: (Array.isArray(a.suggestions) ? a.suggestions : []).slice(0, 8) };
}

/* Hybrid match: local skill overlap (explainable) + Gemini for experience/education context */
export async function matchJob(analysis, job) {
  const jobSkills = findSkills(`${job.title} ${job.description}`);
  const mine = (analysis.skills || []).map(s => s.toLowerCase());
  const matchedSkills = jobSkills.filter(s => mine.includes(s.toLowerCase()));
  const missingSkills = jobSkills.filter(s => !matchedSkills.includes(s));
  const skillMatch = jobSkills.length ? Math.round(matchedSkills.length / jobSkills.length * 100) : 50;
  let ai = null;
  try {
    ai = await gemini(`Compare the candidate with the job. Return JSON only: {"experienceMatch":0,"educationMatch":0,"summary":"","recommendations":[""]}. Scores 0-100.\nCandidate: ${JSON.stringify({ skills: analysis.skills, experience: analysis.experience, education: analysis.education, years: analysis.yearsExperience })}\nJob: ${job.title} at ${job.company}\n${String(job.description).slice(0, 3000)}`);
  } catch (e) { console.error('match AI failed:', e.message); }
  const experienceMatch = ai ? clamp(ai.experienceMatch) : null, educationMatch = ai ? clamp(ai.educationMatch) : null;
  const matchScore = ai ? clamp(skillMatch * 0.6 + experienceMatch * 0.25 + educationMatch * 0.15) : skillMatch;
  return { matchScore, skillMatch, experienceMatch, educationMatch, matchedSkills, missingSkills, summary: ai?.summary || '', recommendations: Array.isArray(ai?.recommendations) ? ai.recommendations.slice(0, 5) : [], aiUsed: !!ai };
}

/* Adzuna job search (official API, no scraping) */
export async function searchJobs({ keyword = '', location = '', country = 'gb', type = '', page = 1 }) {
  const { ADZUNA_APP_ID: id, ADZUNA_APP_KEY: key } = process.env;
  if (!id || !key) throw fail('Job search is not configured (Adzuna keys missing).', 503);
  const c = /^[a-z]{2}$/.test(country) ? country : 'gb';
  const what = [keyword, type === 'internship' ? 'intern' : '', type === 'remote' ? 'remote' : ''].filter(Boolean).join(' ');
  const p = new URLSearchParams({ app_id: id, app_key: key, results_per_page: '20', what });
  if (location) p.set('where', location);
  if (['full_time', 'part_time', 'contract'].includes(type)) p.set(type, '1');
  const r = await fetch(`https://api.adzuna.com/v1/api/jobs/${c}/search/${parseInt(page) || 1}?${p}`);
  if (!r.ok) throw fail('Job service is temporarily unavailable. Please try again later.', 502);
  const d = await r.json();
  return { count: d.count || 0, jobs: (d.results || []).map(j => ({
    id: String(j.id), title: strip(j.title), company: j.company?.display_name || '', location: j.location?.display_name || '',
    description: strip(j.description), salaryMin: j.salary_min, salaryMax: j.salary_max,
    type: j.contract_time || j.contract_type || '', url: j.redirect_url, posted: j.created })) };
}

/* Cloudinary: private upload. Returns null when not configured, so the app still works without it */
export const storeFile = buf => new Promise(resolve => {
  const { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret } = process.env;
  if (!cloud_name || !api_key || !api_secret) return resolve(null);
  cloudinary.config({ cloud_name, api_key, api_secret });
  cloudinary.uploader.upload_stream({ resource_type: 'raw', folder: 'cvs', type: 'private' }, (e, r) => resolve(e ? null : r.secure_url)).end(buf);
});
