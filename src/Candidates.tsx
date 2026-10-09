import { useState, type ChangeEvent } from 'react'
import './App.css'

const SKILLS = [
  'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'node.js', 'express',
  'html', 'css', 'tailwind', 'bootstrap', 'redux', 'python', 'django', 'flask', 'fastapi',
  'java', 'spring', 'c++', 'c#', '.net', 'php', 'laravel', 'sql', 'mysql', 'postgresql',
  'mongodb', 'firebase', 'redis', 'rest api', 'graphql', 'docker', 'kubernetes', 'aws',
  'azure', 'git', 'github', 'linux', 'ci/cd', 'kafka', 'microservices', 'system design',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp',
  'computer vision', 'pandas', 'numpy', 'data analysis', 'power bi', 'tableau', 'excel',
  'figma', 'ui/ux', 'seo', 'wordpress', 'react native', 'flutter', 'kotlin', 'swift',
  'android', 'ios', 'selenium', 'cypress', 'jest', 'manual testing', 'jira', 'agile',
  'scrum', 'communication', 'leadership', 'problem solving', 'teamwork',
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

const maxYears = (text: string) => {
  const m = [...text.toLowerCase().matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/g)].map((x) => +x[1])
  return m.length ? Math.max(...m) : 0
}

const label = (n: number) => (n >= 90 ? 'Excellent' : n >= 75 ? 'Very Good' : n >= 60 ? 'Good' : n >= 40 ? 'Fair' : 'Low')

type Check = { ok: boolean; label: string; tip: string }

type Result = {
  name: string
  email: string
  phone: string
  links: string[]
  years: number
  jobYears: number
  jobTitle: string
  overall: number
  skills: number
  experience: number
  domain: number
  education: number
  matched: string[]
  missing: string[]
  cvSkills: string[]
  roles: { title: string; pct: number }[]
  checks: Check[]
  reasons: string[]
}

function analyze(cv: string, job: string): Result {
  const cvSkills = findSkills(cv)
  const jobSkills = findSkills(job)
  const matched = jobSkills.filter((s) => cvSkills.includes(s))
  const missing = jobSkills.filter((s) => !cvSkills.includes(s))
  const skills = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 0

  const roles = ROLES.map((r) => ({
    title: r.title,
    pct: Math.round((r.skills.filter((s) => cvSkills.includes(s)).length / r.skills.length) * 100),
    overlap: r.skills.filter((s) => jobSkills.includes(s)).length,
  }))
  const target = [...roles].sort((a, b) => b.overlap - a.overlap)[0]
  const domain = target && target.overlap > 0 ? target.pct : 0

  const years = maxYears(cv)
  const jobYears = maxYears(job)
  const lower = cv.toLowerCase()
  const has = (re: RegExp) => re.test(lower)
  const experience = jobYears
    ? Math.min(100, Math.round((years / jobYears) * 100))
    : years ? Math.min(100, 60 + years * 8) : has(/experience|internship/) ? 50 : 20
  const education = has(/bachelor|b\.?tech|bs |bsc|bscs|master|msc|degree|university/) ? 75 : 30
  const overall = Math.round(skills * 0.6 + experience * 0.2 + domain * 0.15 + education * 0.05)

  const firstLine = cv.trim().split(/\n/)[0].trim()
  const name = firstLine && firstLine.length <= 40 && !firstLine.includes('@') ? firstLine : 'Candidate'
  const email = cv.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? ''
  const phone = cv.match(/(\+?\d[\d\s()-]{8,}\d)/)?.[0] ?? ''
  const links = [...cv.matchAll(/(?:linkedin\.com|github\.com)\/[^\s,;)]+/gi)].map((m) => m[0]).slice(0, 2)
  const jobTitle = job.trim().split(/\n/)[0].trim().slice(0, 60)

  const words = cv.trim().split(/\s+/).filter(Boolean).length
  const checks: Check[] = [
    { ok: !!email, label: 'Email address', tip: 'Add an email address so recruiters can reach you.' },
    { ok: !!phone, label: 'Phone number', tip: 'Add a phone number with your country code.' },
    { ok: has(/linkedin\.com|github\.com|portfolio|behance\.net/), label: 'LinkedIn, GitHub or portfolio link', tip: 'Add a link to your LinkedIn or GitHub.' },
    { ok: has(/summary|profile|objective|about me/), label: 'Summary section', tip: 'Add a 2 to 3 line summary at the top.' },
    { ok: has(/experience|internship|employment/), label: 'Experience section', tip: 'Add an Experience or Internship section.' },
    { ok: has(/education|university|bachelor|degree|bs |bsc|bscs/), label: 'Education section', tip: 'Add your degree, university and years.' },
    { ok: has(/skills|technologies|tech stack/), label: 'Skills section', tip: 'Add a separate Skills section.' },
    { ok: has(/projects?/), label: 'Projects section', tip: 'Add 2 or 3 projects with the tools you used.' },
    { ok: /(19|20)\d{2}/.test(cv), label: 'Dates', tip: 'Add years for jobs, projects and education.' },
    { ok: /\d+\s?(%|\+|k\b|users|clients|projects|years)/i.test(cv), label: 'Numbers and results', tip: 'Add measurable results, like "cut load time by 40%".' },
    { ok: has(/\b(built|developed|designed|created|led|implemented|managed|improved|optimized|launched|deployed)\b/), label: 'Action words', tip: 'Start bullets with verbs like built, developed or led.' },
    { ok: !has(/responsible for|hardworking|hard-working|team player|references available|detail oriented/), label: 'No weak phrases', tip: 'Remove "responsible for", "hardworking" and "references available".' },
    { ok: !has(/cnic|father'?s? name|marital status|date of birth|religion|nationality/), label: 'No personal details', tip: 'Remove CNIC, father name, marital status and date of birth.' },
    { ok: words >= 250 && words <= 900, label: `Length (${words} words)`, tip: 'Aim for 250 to 900 words.' },
  ]

  const reasons: string[] = []
  if (matched.length) reasons.push(`Matches ${matched.length} of ${jobSkills.length} required skills (${matched.slice(0, 4).join(', ')}).`)
  if (years) reasons.push(`${years}+ years of experience mentioned${jobYears ? `, the job asks for ${jobYears}+` : ''}.`)
  if (domain >= 60 && target) reasons.push(`Strong fit for the ${target.title} profile.`)
  if (education >= 75) reasons.push('Relevant education background found.')
  if (!reasons.length) reasons.push('Few overlaps found. Add more of the job skills to your CV.')

  return {
    name, email, phone, links, years, jobYears, jobTitle, overall, skills, experience, domain, education,
    matched, missing, cvSkills, roles: roles.sort((a, b) => b.pct - a.pct).filter((r) => r.pct > 0).slice(0, 6),
    checks, reasons,
  }
}

function Ring({ value }: { value: number }) {
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 180 180" className="ring" role="img" aria-label={`Match score ${value}%`}>
      <circle cx="90" cy="90" r={r} fill="none" stroke="#ece9fb" strokeWidth="14" />
      <circle
        cx="90" cy="90" r={r} fill="none" stroke="var(--brand)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 90 90)"
      />
      <text x="90" y="92" textAnchor="middle" className="ring-num">{value}%</text>
      <text x="90" y="116" textAnchor="middle" className="ring-sub">{label(value).toUpperCase()}</text>
    </svg>
  )
}

function Bar({ value, dim }: { value: number; dim?: boolean }) {
  return (
    <span className="bar" aria-hidden="true">
      <span style={{ width: `${value}%` }} className={dim ? 'dim' : ''} />
    </span>
  )
}

type Saved = { name: string; score: number; status: string; job: string }

export default function Candidates({ onSave }: { onSave: (c: Saved) => void }) {
  const [cv, setCv] = useState('')
  const [job, setJob] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const [status, setStatus] = useState('')

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
    if (cv.trim().length < 50) return setError('Add your CV first. Paste the text or upload a file.')
    if (job.trim().length < 30) return setError('Add the job description. Paste the full job post from Indeed, LinkedIn or Rozee.pk.')
    setError('')
    setStatus('')
    setResult(analyze(cv, job))
  }

  const reset = () => {
    setResult(null)
    setCv('')
    setJob('')
    setStatus('')
  }

  const save = (st: string) => {
    setStatus(st)
    if (result) onSave({ name: result.name, score: result.overall, status: st, job: result.jobTitle })
  }

  const r = result
  const initials = r ? r.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : ''
  const jobSkills = r ? [...r.matched, ...r.missing] : []

  return (
    <>
                <div className="head">
          <div>
            <h1>Semantic JD Matching</h1>
            <p className="sub">{r ? `Job: ${r.jobTitle}` : 'Compare a CV with a job description and see the match.'}</p>
          </div>
          {r && (
            <div className="head-btns">
              <button type="button" className="btn-out" onClick={reset}>New match</button>
              <button type="button" className="btn-out" onClick={() => window.print()}>Print report</button>
            </div>
          )}
        </div>

        {!r && (
          <section className="card inputs">
            <div>
              <div className="field-head">
                <label htmlFor="cv">Your CV</label>
                <label className="upload">
                  {reading ? 'Reading...' : 'Upload PDF, DOCX or TXT'}
                  <input type="file" accept=".pdf,.docx,.txt" onChange={onFile} disabled={reading} />
                </label>
              </div>
              <textarea id="cv" value={cv} onChange={(e) => setCv(e.target.value)}
                placeholder="Paste the full text of your CV here, or upload a PDF, DOCX or TXT file" />
            </div>
            <div>
              <div className="field-head"><label htmlFor="job">Job description</label></div>
              <textarea id="job" value={job} onChange={(e) => setJob(e.target.value)}
                placeholder={'Paste the full job description here.\nStart with the job title on the first line.\nCopy it from Indeed, LinkedIn or Rozee.pk.'} />
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="actions">
              <button type="button" className="btn-pri" onClick={run}>Analyze CV</button>
            </div>
          </section>
        )}

        {r && (
          <div className="grid">
            <div className="col">
              <section className="card">
                <div className="cand">
                  <span className="avatar">{initials}</span>
                  <div>
                    <h2>{r.name}</h2>
                    <small>{r.years ? `${r.years}+ years experience` : 'Experience not stated'}</small>
                  </div>
                  <span className="tag">AI Parsed</span>
                </div>
                <ul className="contact">
                  <li>{r.email || 'No email found'}</li>
                  <li>{r.phone || 'No phone found'}</li>
                  {r.links.map((l) => <li key={l}>{l}</li>)}
                </ul>
              </section>

              <section className="card">
                <h3>Job Description</h3>
                <h2>{r.jobTitle}</h2>
                <p className="muted">Skills the job asks for:</p>
                <ul className="chips">
                  {jobSkills.map((s) => <li key={s} className={r.matched.includes(s) ? 'chip ok' : 'chip miss'}>{s}</li>)}
                  {!jobSkills.length && <li className="muted">No known skills found in this job post.</li>}
                </ul>
                {r.jobYears > 0 && <p className="muted">{r.jobYears}+ years of experience required.</p>}
              </section>

              <section className="card">
                <h3>Matching Details</h3>
                <dl className="meta">
                  <dt>Matched on</dt><dd>{new Date().toLocaleString()}</dd>
                  <dt>Method</dt><dd>Skill and keyword match</dd>
                  <dt>Confidence threshold</dt><dd>70%</dd>
                </dl>
              </section>
            </div>

            <div className="col wide">
              <section className="card">
                <div className="between">
                  <h3>Overall Match Score</h3>
                  <span className={r.overall >= 70 ? 'pill ok' : 'pill warn'}>
                    {r.overall >= 70 ? 'Strong match' : r.overall >= 40 ? 'Partial match' : 'Weak match'}
                  </span>
                </div>
                <div className="score-row">
                  <Ring value={r.overall} />
                  <div className="break">
                    <h4>Score Breakdown</h4>
                    {([['Skills', 'Tools and technologies', r.skills], ['Experience', 'Years of relevant work', r.experience], ['Domain', 'Fit with the closest role', r.domain]] as const).map(([t, d, v]) => (
                      <div key={t} className="brow">
                        <div><b>{t}</b><small>{d}</small></div>
                        <Bar value={v} /><span className="pct">{v}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="note">This score compares the skills, years and role fit found in the CV with the job post.</p>
              </section>

              <section className="card">
                <h3>Detailed Score Breakdown</h3>
                <div className="tbl">
                  <div className="tr th"><span>Category</span><span>What we look for</span><span>Candidate strength</span><span>Score</span></div>
                  <div className="tr"><b>Skills</b><span>Languages, frameworks, tools</span>
                    <span className="chips">{r.matched.slice(0, 3).map((s) => <i key={s} className="chip ok">{s}</i>)}{r.matched.length > 3 && <i className="more">+{r.matched.length - 3} more</i>}</span>
                    <span className="sc">{r.skills}%<small>{label(r.skills)}</small></span></div>
                  <div className="tr"><b>Experience</b><span>Years and relevance</span>
                    <span className="chips"><i className="chip ok">{r.years ? `${r.years}+ years` : 'Not stated'}</i></span>
                    <span className="sc">{r.experience}%<small>{label(r.experience)}</small></span></div>
                  <div className="tr"><b>Domain</b><span>Role and domain fit</span>
                    <span className="chips">{r.roles.slice(0, 2).map((x) => <i key={x.title} className="chip ok">{x.title}</i>)}</span>
                    <span className="sc">{r.domain}%<small>{label(r.domain)}</small></span></div>
                  <div className="tr"><b>Education</b><span>Degree or university</span>
                    <span className="chips"><i className="chip ok">{r.education >= 75 ? 'Degree found' : 'Not found'}</i></span>
                    <span className="sc">{r.education}%<small>{label(r.education)}</small></span></div>
                </div>
              </section>

              <section className="card">
                <h3>CV Checks</h3>
                <ul className="checks">
                  {r.checks.map((c) => (
                    <li key={c.label} className={c.ok ? 'pass' : 'fail'}>
                      <b>{c.ok ? 'Pass' : 'Fix'}</b>
                      <span>{c.label}{!c.ok && <em>{c.tip}</em>}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="col">
              <section className="card">
                <h3>Why This Candidate Matches</h3>
                <ul className="why">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
              </section>

              <section className="card">
                <div className="between"><h3>Skills Overlap</h3><small><i className="dot on" /> Matched <i className="dot" /> Missing</small></div>
                <ul className="overlap">
                  {jobSkills.map((s) => {
                    const ok = r.matched.includes(s)
                    return (
                      <li key={s}><b>{s}</b><Bar value={ok ? 100 : 12} dim={!ok} /><span className="pct">{ok ? '100%' : '0%'}</span></li>
                    )
                  })}
                </ul>
              </section>

              <section className="card">
                <h3>Roles That Fit</h3>
                <ul className="overlap">
                  {r.roles.map((x) => <li key={x.title}><b>{x.title}</b><Bar value={x.pct} /><span className="pct">{x.pct}%</span></li>)}
                </ul>
              </section>
            </div>
          </div>
        )}

        {r && (
          <section className="reco">
            <div>
              <h3>AI Recommendation</h3>
              <p>
                {status
                  ? `Status: ${status}`
                  : r.overall >= 70
                    ? `${r.name} is a top match for this role. We recommend moving this candidate to the shortlist.`
                    : r.overall >= 40
                      ? `${r.name} is a partial match. Review the missing skills before deciding.`
                      : `${r.name} is missing most required skills for this role.`}
              </p>
            </div>
            <div className="reco-btns">
              <button type="button" className="btn-pri" onClick={() => save('Shortlisted')}>Add to Shortlist</button>
              <button type="button" className="btn-out" onClick={() => save('In review')}>Move to Review</button>
              <button type="button" className="btn-out" onClick={() => save('Not a fit')}>Not a Fit</button>
            </div>
          </section>
        )}
    </>
  )
}
