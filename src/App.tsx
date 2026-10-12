import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useCol, DEMO_UID, type AppUser } from './data'
import Login from './Login'
import Candidates from './Candidates'
import { Analytics, Calendar, Dashboard, Inbox, Interviews, Jobs, Settings } from './Pages'
import './App.css'

const NAV = ['Dashboard', 'Jobs', 'Candidates', 'Calendar', 'Interviews', 'Analytics', 'Inbox', 'Settings']

function Shell({ user, onExit }: { user: AppUser; onExit: () => void }) {
  const [page, setPage] = useState('Dashboard')
  const cands = useCol(user.uid, 'candidates')
  const jobs = useCol(user.uid, 'jobs')
  const events = useCol(user.uid, 'events')
  const ivs = useCol(user.uid, 'interviews')
  const msgs = useCol(user.uid, 'messages')
  const unread = msgs.items.filter((m) => !m.read).length
  const name = user.displayName || user.email || 'You'

  const notify = (subject: string, body: string) => msgs.add({ subject, body, read: false, date: Date.now() })

  return (
    <div className="shell">
      <aside className="side">
        <div className="logo"><span>H</span>HireAI</div>
        <nav>
          {NAV.map((n) => (
            <button key={n} type="button" className={n === page ? 'nav on' : 'nav'} onClick={() => setPage(n)}>
              {n}{n === 'Inbox' && unread > 0 && <i className="badge">{unread}</i>}
            </button>
          ))}
        </nav>
        {user.uid === DEMO_UID && <p className="demo-tag">Demo mode: sample data, nothing is saved.</p>}
        <div className="me"><span className="av">{name[0].toUpperCase()}</span><div><b>{name}</b><small>{user.uid === DEMO_UID ? 'Demo mode' : 'Recruiter'}</small></div></div>
      </aside>
      <main className="main">
        {page === 'Dashboard' && <Dashboard cands={cands} jobs={jobs} ivs={ivs} />}
        {page === 'Jobs' && <Jobs jobs={jobs} />}
        {page === 'Candidates' && (
          <Candidates onSave={(c) => { cands.add({ ...c, created: Date.now() }); notify(`${c.name} marked ${c.status}`, `${c.score}% match for ${c.job}`) }} />
        )}
        {page === 'Calendar' && <Calendar events={events} ivs={ivs} />}
        {page === 'Interviews' && <Interviews ivs={ivs} cands={cands} jobs={jobs} notify={notify} />}
        {page === 'Analytics' && <Analytics cands={cands} jobs={jobs} ivs={ivs} />}
        {page === 'Inbox' && <Inbox msgs={msgs} />}
        {page === 'Settings' && <Settings user={user} onExit={onExit} />}
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined)
  const [demo, setDemo] = useState(false)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  if (demo) return <Shell user={{ uid: DEMO_UID, displayName: 'Demo Recruiter', email: 'demo@hireai.app' }} onExit={() => setDemo(false)} />
  if (user === undefined) return <p className="loading">Loading...</p>
  return user ? <Shell user={user} onExit={() => {}} /> : <Login onDemo={() => setDemo(true)} />
}
