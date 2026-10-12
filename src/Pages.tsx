import { useState, type FormEvent, type ReactNode } from 'react'
import { sendPasswordResetEmail, updateProfile, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { DEMO_UID, type AppUser, type Col } from './data'

const fmt = (v: unknown) => new Date(String(v)).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
const STATUSES = ['Scheduled', 'Done', 'Cancelled']

function Page({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <>
      <div className="head"><div><h1>{title}</h1><p className="sub">{sub}</p></div></div>
      {children}
    </>
  )
}
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="fld"><span>{label}</span>{children}</label>
)
const Empty = ({ text }: { text: string }) => <p className="muted">{text}</p>

export function Dashboard({ cands, jobs, ivs }: { cands: Col; jobs: Col; ivs: Col }) {
  const now = new Date().toISOString()
  const upcoming = ivs.items.filter((i) => i.status === 'Scheduled' && String(i.date) >= now.slice(0, 16)).sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const avg = cands.items.length ? Math.round(cands.items.reduce((n, c) => n + Number(c.score), 0) / cands.items.length) : 0
  const stats: [string, number | string][] = [
    ['Candidates', cands.items.length], ['Open jobs', jobs.items.filter((j) => j.status === 'Open').length],
    ['Upcoming interviews', upcoming.length], ['Average match', `${avg}%`],
  ]
  return (
    <Page title="Dashboard" sub="Your hiring at a glance.">
      <div className="stats">{stats.map(([l, v]) => <div key={l} className="card stat"><b>{v}</b><span>{l}</span></div>)}</div>
      <div className="two">
        <section className="card"><h3>Upcoming interviews</h3>
          {upcoming.slice(0, 5).map((i) => <p key={i.id} className="row"><b>{i.candidate}</b><span>{fmt(i.date)}</span></p>)}
          {!upcoming.length && <Empty text="No interviews scheduled. Add one in Interviews." />}
        </section>
        <section className="card"><h3>Recent candidates</h3>
          {cands.items.slice(0, 6).map((c) => (
            <p key={c.id} className="row"><b>{c.name}</b><span>{c.score}% · {c.status}</span>
              <button className="x" onClick={() => cands.del(c.id)} aria-label={`Delete ${c.name}`}>Delete</button></p>
          ))}
          {!cands.items.length && <Empty text="No candidates yet. Analyze a CV in Candidates and choose a status." />}
        </section>
      </div>
    </Page>
  )
}

export function Jobs({ jobs }: { jobs: Col }) {
  const [f, setF] = useState({ title: '', location: '', skills: '' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.title.trim()) return
    jobs.add({ ...f, status: 'Open', created: Date.now() })
    setF({ title: '', location: '', skills: '' })
  }
  return (
    <Page title="Jobs" sub="Create and manage open roles.">
      <form className="card form" onSubmit={submit}>
        <Field label="Job title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></Field>
        <Field label="Location"><input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
        <Field label="Key skills"><input value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} placeholder="react, node.js, sql" /></Field>
        <button className="btn-pri" type="submit">Add job</button>
      </form>
      <div className="list">
        {jobs.items.map((j) => (
          <section key={j.id} className="card row">
            <div><h2>{j.title}</h2><small className="muted">{j.location || 'No location'} · {j.skills || 'No skills listed'}</small></div>
            <span className={j.status === 'Open' ? 'pill ok' : 'pill warn'}>{j.status}</span>
            <button className="btn-out" onClick={() => jobs.set(j.id, { status: j.status === 'Open' ? 'Closed' : 'Open' })}>{j.status === 'Open' ? 'Close' : 'Reopen'}</button>
            <button className="x" onClick={() => jobs.del(j.id)}>Delete</button>
          </section>
        ))}
        {!jobs.items.length && <Empty text="No jobs yet. Add your first role above." />}
      </div>
    </Page>
  )
}

export function Calendar({ events, ivs }: { events: Col; ivs: Col }) {
  const [m, setM] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [f, setF] = useState({ title: '', date: '' })
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
  const key = (d: number) => `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const all = [
    ...events.items.map((e) => ({ id: e.id, t: String(e.title), d: String(e.date).slice(0, 10), own: true })),
    ...ivs.items.map((i) => ({ id: i.id, t: `Interview: ${i.candidate}`, d: String(i.date).slice(0, 10), own: false })),
  ]
  const cells = [...Array(m.getDay()).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)]
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (f.title && f.date) { events.add({ ...f }); setF({ title: '', date: '' }) }
  }
  return (
    <Page title="Calendar" sub="Events and interviews in one place.">
      <form className="card form" onSubmit={submit}>
        <Field label="Event"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></Field>
        <Field label="Date"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
        <button className="btn-pri" type="submit">Add event</button>
      </form>
      <section className="card">
        <div className="between">
          <button className="btn-out" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}>Previous</button>
          <h2>{m.toLocaleString([], { month: 'long', year: 'numeric' })}</h2>
          <button className="btn-out" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}>Next</button>
        </div>
        <div className="cal">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <b key={d} className="dow">{d}</b>)}
          {cells.map((d, i) => (
            <div key={i} className={d ? 'day' : 'day off'}>
              {d > 0 && <small>{d}</small>}
              {d > 0 && all.filter((e) => e.d === key(d)).map((e) => (
                <span key={e.id} className={e.own ? 'ev' : 'ev iv'} title={e.own ? 'Click to delete' : e.t}
                  onClick={() => e.own && events.del(e.id)}>{e.t}</span>
              ))}
            </div>
          ))}
        </div>
      </section>
    </Page>
  )
}

export function Interviews({ ivs, cands, jobs, notify }: { ivs: Col; cands: Col; jobs: Col; notify: (s: string, b: string) => void }) {
  const [f, setF] = useState({ candidate: '', job: '', date: '' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.candidate || !f.date) return
    ivs.add({ ...f, status: 'Scheduled' })
    notify(`Interview scheduled with ${f.candidate}`, `${fmt(f.date)}${f.job ? ` for ${f.job}` : ''}`)
    setF({ candidate: '', job: '', date: '' })
  }
  const sorted = [...ivs.items].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  return (
    <Page title="Interviews" sub="Schedule and track every interview.">
      <form className="card form" onSubmit={submit}>
        <Field label="Candidate">
          <input list="cn" value={f.candidate} onChange={(e) => setF({ ...f, candidate: e.target.value })} required />
          <datalist id="cn">{cands.items.map((c) => <option key={c.id} value={String(c.name)} />)}</datalist>
        </Field>
        <Field label="Job">
          <input list="jn" value={f.job} onChange={(e) => setF({ ...f, job: e.target.value })} />
          <datalist id="jn">{jobs.items.map((j) => <option key={j.id} value={String(j.title)} />)}</datalist>
        </Field>
        <Field label="Date and time"><input type="datetime-local" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
        <button className="btn-pri" type="submit">Schedule</button>
      </form>
      <div className="list">
        {sorted.map((i) => (
          <section key={i.id} className="card row">
            <div><h2>{i.candidate}</h2><small className="muted">{fmt(i.date)}{i.job ? ` · ${i.job}` : ''}</small></div>
            <select value={String(i.status)} onChange={(e) => ivs.set(i.id, { status: e.target.value })} aria-label="Status">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="x" onClick={() => ivs.del(i.id)}>Delete</button>
          </section>
        ))}
        {!sorted.length && <Empty text="No interviews yet. Schedule one above." />}
      </div>
    </Page>
  )
}

export function Analytics({ cands, jobs, ivs }: { cands: Col; jobs: Col; ivs: Col }) {
  const count = (c: Col, k: string, v: string) => c.items.filter((x) => x[k] === v).length
  const bucket = (lo: number, hi: number) => cands.items.filter((c) => Number(c.score) >= lo && Number(c.score) <= hi).length
  const groups: [string, [string, number][]][] = [
    ['Candidates by status', ['Shortlisted', 'In review', 'Not a fit'].map((s) => [s, count(cands, 'status', s)])],
    ['Match score range', [['70 to 100', bucket(70, 100)], ['40 to 69', bucket(40, 69)], ['0 to 39', bucket(0, 39)]]],
    ['Interviews by status', STATUSES.map((s) => [s, count(ivs, 'status', s)])],
    ['Jobs', [['Open', count(jobs, 'status', 'Open')], ['Closed', count(jobs, 'status', 'Closed')]]],
  ]
  return (
    <Page title="Analytics" sub="How your pipeline is performing.">
      <div className="two">
        {groups.map(([t, rows]) => {
          const max = Math.max(1, ...rows.map((r) => r[1]))
          return (
            <section key={t} className="card"><h3>{t}</h3>
              <ul className="overlap">{rows.map(([l, n]) => (
                <li key={l}><b>{l}</b><span className="bar"><span style={{ width: `${(n / max) * 100}%` }} /></span><span className="pct">{n}</span></li>
              ))}</ul>
            </section>
          )
        })}
      </div>
    </Page>
  )
}

export function Inbox({ msgs }: { msgs: Col }) {
  const [f, setF] = useState({ subject: '', body: '' })
  const sorted = [...msgs.items].sort((a, b) => Number(b.date) - Number(a.date))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (f.subject.trim()) { msgs.add({ ...f, read: true, date: Date.now() }); setF({ subject: '', body: '' }) }
  }
  return (
    <Page title="Inbox" sub="Activity alerts and your own notes.">
      <form className="card form" onSubmit={submit}>
        <Field label="Subject"><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} required /></Field>
        <Field label="Note"><input value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        <button className="btn-pri" type="submit">Save note</button>
      </form>
      <div className="list">
        {sorted.map((m) => (
          <section key={m.id} className={`card row ${m.read ? '' : 'unread'}`} onClick={() => !m.read && msgs.set(m.id, { read: true })}>
            <div><h2>{m.subject}</h2><small className="muted">{m.body} · {fmt(m.date)}</small></div>
            {!m.read && <span className="pill ok">New</span>}
            <button className="x" onClick={(e) => { e.stopPropagation(); msgs.del(m.id) }}>Delete</button>
          </section>
        ))}
        {!sorted.length && <Empty text="Inbox is empty. Alerts appear here when you shortlist candidates or schedule interviews." />}
      </div>
    </Page>
  )
}

export function Settings({ user, onExit }: { user: AppUser; onExit: () => void }) {
  const demo = user.uid === DEMO_UID
  const [name, setName] = useState(user.displayName ?? '')
  const [msg, setMsg] = useState('')
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); setMsg(ok) } catch (e) { setMsg(e instanceof Error ? e.message : 'Something went wrong.') }
  }
  return (
    <Page title="Settings" sub="Your account.">
      <section className="card form one">
        <Field label="Email"><input value={user.email ?? ''} disabled /></Field>
        <Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        {demo ? <p className="muted">Account changes are disabled in demo mode.</p> : <>
          <button className="btn-pri" onClick={() => run(() => updateProfile(auth.currentUser!, { displayName: name }), 'Name saved.')}>Save name</button>
          <button className="btn-out" onClick={() => user.email && run(() => sendPasswordResetEmail(auth, user.email!), 'Password reset email sent.')}>Send password reset email</button>
        </>}
        <button className="btn-out" onClick={() => (demo ? onExit() : signOut(auth))}>{demo ? 'Exit demo' : 'Sign out'}</button>
        {msg && <p className="muted" role="status">{msg}</p>}
      </section>
    </Page>
  )
}
