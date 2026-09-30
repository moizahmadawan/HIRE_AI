import { useState, type ChangeEvent, type ReactNode } from 'react'
import './App.css'

const SKILLS = [
  'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'node.js', 'express',
  'html', 'css', 'tailwind', 'bootstrap', 'redux', 'python', 'django', 'flask', 'fastapi',
  'java', 'spring', 'c++', 'c#', '.net', 'php', 'laravel', 'sql', 'mysql', 'postgresql',
  'mongodb', 'firebase', 'redis', 'rest api', 'graphql', 'docker', 'kubernetes', 'aws',
  'azure', 'git', 'github', 'linux', 'ci/cd', 'machine learning', 'deep learning',
  'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'computer vision', 'pandas', 'numpy',
  'data analysis', 'power bi', 'tableau', 'excel', 'figma', 'ui/ux', 'seo', 'wordpress',
  'react native', 'flutter', 'kotlin', 'swift', 'android', 'ios', 'selenium', 'cypress',
  'jest', 'manual testing', 'jira', 'agile', 'scrum', 'communication', 'leadership',
  'problem solving', 'teamwork',
]

const ROLES: { title: string; skills: string[] }[] = [
  { title: 'Frontend Developer', skills: ['javascript', 'typescript', 'react', 'html', 'css', 'tailwind', 'git'] },
  { title: 'Backend Developer', skills: ['node.js', 'express', 'python', 'django', 'sql', 'postgresql', 'rest api', 'docker'] },
  { title: 'Full Stack Developer', skills: ['javascript', 'react', 'node.js', 'express', 'mongodb', 'sql', 'rest api', 'git'] },
  { title: 'MERN Stack Developer', skills: ['mongodb', 'express', 'react', 'node.js', 'javascript', 'rest api'] },
  { title: 'Python Developer', skills: ['python', 'django', 'flask', 'fastapi', 'sql', 'rest api', 'git'] },
  { title: 'Java Developer', skills: ['java', 'spring', 'mysql', 'rest api', 'git', 'docker'] },
  { title: '.NET Developer', skills: ['c#', '.net', 'sql', 'rest api', 'azure', 'git'] },
  { title: 'PHP / Laravel Developer', skills: ['php', 'laravel', 'mysql', 'html', 'css', 'rest api'] },
  { title: 'WordPress Developer', skills: ['wordpress', 'php', 'html', 'css', 'javascript', 'seo'] },
  { title: 'Mobile App Developer', skills: ['react native', 'flutter', 'kotlin', 'swift', 'android', 'ios', 'firebase'] },
  { title: 'Data Analyst', skills: ['python', 'sql', 'excel', 'power bi', 'tableau', 'pandas', 'data analysis'] },
  { title: 'Machine Learning Engineer', skills: ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'numpy'] },
  { title: 'AI / NLP Engineer', skills: ['python', 'nlp', 'deep learning', 'pytorch', 'tensorflow', 'computer vision'] },
  { title: 'DevOps Engineer', skills: ['docker', 'kubernetes', 'aws', 'linux', 'ci/cd', 'git'] },
  { title: 'Cloud Engineer', skills: ['aws', 'azure', 'linux', 'docker', 'kubernetes', 'ci/cd'] },
  { title: 'QA / Test Engineer', skills: ['selenium', 'cypress', 'jest', 'manual testing', 'jira', 'agile'] },
  { title: 'UI/UX Designer', skills: ['figma', 'ui/ux', 'html', 'css', 'communication'] },
  { title: 'Project Manager', skills: ['agile', 'scrum', 'jira', 'leadership', 'communication', 'teamwork'] },
]

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

function findSkills(text: string): string[] {
  const t = text.toLowerCase()
  return SKILLS.filter((s) => new RegExp(`(^|[^a-z0-9])${escapeRe(s)}($|[^a-z0-9])`).test(t))
}

function Hint({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="hint">
      <button
        type="button"
        className="hint-btn"
        aria-label={`Help: ${title}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r="1.3" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <span role="note" className="hint-pop">
          <strong>{title}</strong>
          {children}
        </span>
      )}
    </span>
  )
}

type Check = { ok: boolean; label: string; tip: string }

type Result = {
  score: number | null
  matched: string[]
  missing: string[]
  cvSkills: string[]
  roles: { title: string; pct: number }[]
  checks: Check[]
}

function analyze(cv: string, job: string): Result {
  const cvSkills = findSkills(cv)
  const jobSkills = findSkills(job)
  const matched = jobSkills.filter((s) => cvSkills.includes(s))
  const missing = jobSkills.filter((s) => !cvSkills.includes(s))
  const score = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : null

  const roles = ROLES.map((r) => ({
    title: r.title,
    pct: Math.round((r.skills.filter((s) => cvSkills.includes(s)).length / r.skills.length) * 100),
  }))
    .sort((a, b) => b.pct - a.pct)
    .filter((r) => r.pct > 0)
    .slice(0, 8)

  const words = cv.trim().split(/\s+/).filter(Boolean).length
  const lower = cv.toLowerCase()
  const has = (re: RegExp) => re.test(lower)

  const checks: Check[] = [
    {
      ok: /[\w.+-]+@[\w-]+\.[\w.]+/.test(cv),
      label: 'Email address',
      tip: 'Add an email address so recruiters can reach you.',
    },
    {
      ok: /(\+?\d[\d\s()-]{8,}\d)/.test(cv),
      label: 'Phone number',
      tip: 'Add a phone number with your country code.',
    },
    {
      ok: has(/linkedin\.com|github\.com|portfolio|behance\.net/),
      label: 'LinkedIn, GitHub or portfolio link',
      tip: 'Add a link to your LinkedIn or GitHub so recruiters can see your work.',
    },
    {
      ok: has(/summary|profile|objective|about me/),
      label: 'Summary section',
      tip: 'Add a 2 to 3 line summary at the top about who you are and what you do.',
    },
    {
      ok: has(/experience|internship|employment/),
      label: 'Experience section',
      tip: 'Add an Experience or Internship section, even a short one.',
    },
    {
      ok: has(/education|university|bachelor|degree|bs |bsc|bscs/),
      label: 'Education section',
      tip: 'Add your degree, university and years.',
    },
    {
      ok: has(/skills|technologies|tech stack/),
      label: 'Skills section',
      tip: 'Add a separate Skills section with your tools and languages.',
    },
    {
      ok: has(/projects?/),
      label: 'Projects section',
      tip: 'Add 2 or 3 projects with what you built and which tools you used.',
    },
    {
      ok: /(19|20)\d{2}/.test(cv),
      label: 'Dates',
      tip: 'Add years for your jobs, projects and education.',
    },
    {
      ok: /\d+\s?(%|\+|k\b|users|clients|projects|years)/i.test(cv),
      label: 'Numbers and results',
      tip: 'Add measurable results, like "cut load time by 40%".',
    },
    {
      ok: has(/\b(built|developed|designed|created|led|implemented|managed|improved|optimized|launched|deployed)\b/),
      label: 'Action words',
      tip: 'Start your bullet points with verbs like built, developed, led or improved.',
    },
    {
      ok: !has(/responsible for|hardworking|hard-working|team player|references available|detail oriented/),
      label: 'No weak phrases',
      tip: 'Remove phrases like "responsible for", "hardworking" and "references available". Show results instead.',
    },
    {
      ok: !has(/cnic|father'?s? name|marital status|date of birth|religion|nationality/),
      label: 'No personal details',
      tip: 'Remove CNIC, father name, marital status, religion and date of birth. Recruiters do not need them.',
    },
    {
      ok: words >= 250 && words <= 900,
      label: `Length (${words} words)`,
      tip: 'Aim for 250 to 900 words, roughly one to two pages.',
    },
  ]

  return { score, matched, missing, cvSkills, roles, checks }
}

function Chips({ items, tone }: { items: string[]; tone: 'good' | 'gap' | 'plain' }) {
  if (!items.length) return <p className="muted">None found.</p>
  return (
    <ul className="chips">
      {items.map((s) => (
        <li key={s} className={`chip ${tone}`}>
          {s}
        </li>
      ))}
    </ul>
  )
}

function App() {
  const [cv, setCv] = useState('')
  const [job, setJob] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    setError('')
    setReading(true)
    try {
      const name = file.name.toLowerCase()
      let text = ''
      if (name.endsWith('.txt')) {
        text = await file.text()
      } else if (name.endsWith('.pdf')) {
        const pdfjs = await import('pdfjs-dist')
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjs.GlobalWorkerOptions.workerSrc = worker
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n'
        }
      } else if (name.endsWith('.docx')) {
        const mammoth = (await import('mammoth/mammoth.browser')).default
        text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value
      } else {
        throw new Error('Unsupported file type. Use PDF, DOCX or TXT.')
      }
      if (text.trim().length < 20) {
        throw new Error('No text found in this file. If it is a scanned PDF, paste the text instead.')
      }
      setCv(text)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Could not read this file. Paste the text instead.')
    } finally {
      setReading(false)
      input.value = ''
    }
  }

  const run = () => {
    if (cv.trim().length < 50) {
      setError('Add your CV first. Paste the text or upload a file.')
      return
    }
    if (job.trim().length < 30) {
      setError('Add the job description. Paste the full job post from Indeed, LinkedIn or Rozee.pk.')
      return
    }
    setError('')
    setResult(analyze(cv, job))
  }

  const tone = result?.score == null ? 'plain' : result.score >= 70 ? 'good' : result.score >= 40 ? 'mid' : 'gap'

  return (
    <main className="page">
      <header className="top">
        <h1>Check your CV against the job before you apply</h1>
        <p>
          Upload your CV and paste the job description. See which required skills you match,
          which ones are missing, and which roles fit you best.
        </p>
      </header>

      <section className="inputs">
        <div className="field">
          <div className="field-head">
            <span className="label-group">
              <label htmlFor="cv">Your CV</label>
              <Hint title="What to add here">
                <span>Paste the text of your own CV, or upload it as a PDF, DOCX or TXT file using the button on the right.</span>
                <span>Use a file made on a computer. A scanned photo of a CV cannot be read.</span>
              </Hint>
            </span>
            <label className="upload">
              {reading ? 'Reading...' : 'Upload PDF, DOCX or TXT'}
              <input type="file" accept=".pdf,.docx,.txt" onChange={onFile} disabled={reading} />
            </label>
          </div>
          <textarea
            id="cv"
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder="Paste the full text of your CV here, or upload a PDF, DOCX or TXT file using the button above"
          />
        </div>
        <div className="field">
          <div className="field-head">
            <span className="label-group">
              <label htmlFor="job">Job description</label>
              <Hint title="What to add here">
                <span>Open a job post on Indeed, LinkedIn or Rozee.pk, copy the full description, and paste it here.</span>
              <span>This is required. Your CV is compared with this job to find matching and missing skills.</span>
              </Hint>
            </span>
          </div>
          <textarea
            id="job"
            value={job}
            onChange={(e) => setJob(e.target.value)}
         placeholder={`Paste the full job description here.
Copy it from a job site such as Indeed, LinkedIn or Rozee.pk.
Include the required skills and responsibilities for the best match.`} />
        </div>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="button" className="primary" onClick={run}>
          Analyze CV
        </button>
        {result && (
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setResult(null)
              setCv('')
              setJob('')
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {result && (
        <section className="results" aria-live="polite">
          <div className={`score ${tone}`}>
            <span className="score-num">{result.score == null ? '--' : `${result.score}%`}</span>
            <span className="score-label">
              {result.score == null
                ? 'Add a job description to get a match score.'
                : `${result.matched.length} of ${result.matched.length + result.missing.length} required skills found in your CV`}
            </span>
          </div>

          <div className="cols">
            <div className="block">
              <h2>Skills you match</h2>
              <Chips items={result.matched} tone="good" />
              <h2>Skills to add</h2>
              <Chips items={result.missing} tone="gap" />
            </div>

            <div className="block">
              <h2>Skills found in your CV</h2>
              <Chips items={result.cvSkills} tone="plain" />
              <h2>Roles that fit you</h2>
              <ul className="roles">
                {result.roles.map((r) => (
                  <li key={r.title}>
                    <span>{r.title}</span>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${r.pct}%` }} />
                    </span>
                    <span className="pct">{r.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="block">
            <h2>CV checks</h2>
            <ul className="checks">
              {result.checks.map((c) => (
                <li key={c.label} className={c.ok ? 'pass' : 'fail'}>
                  <strong>{c.ok ? 'Pass' : 'Fix'}</strong>
                  <span>
                    {c.label}
                    {!c.ok && <em>{c.tip}</em>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}

export default App