import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'
import { useCol } from './data'
import Login from './Login'
import Candidates from './Candidates'
import { Analytics, Calendar, Dashboard, Inbox, Interviews, Jobs, Settings } from './Pages'
import './App.css'

const NAV = ['Dashboard', 'Jobs', 'Candidates', 'Calendar', 'Interviews', 'Analytics', 'Inbox', 'Settings']

function Shell({ user }: { user: User }) {
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
        <div className="me"><span className="av">{name[0].toUpperCase()}</span><div><b>{name}</b><small>Recruiter</small></div></div>
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
        {page === 'Settings' && <Settings user={user} />}
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  if (user === undefined) return <p className="loading">Loading...</p>
  return user ? <Shell user={user} /> : <Login />
}
