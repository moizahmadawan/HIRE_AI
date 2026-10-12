import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

type Val = string | number | boolean
export type Item = { id: string } & Record<string, Val>
export type Col = {
  items: Item[]
  add: (d: Record<string, Val>) => Promise<unknown>
  set: (id: string, d: Record<string, Val>) => Promise<void>
  del: (id: string) => Promise<void>
}

export const DEMO_UID = 'demo'
export type AppUser = { uid: string; displayName: string | null; email: string | null }

const day = 86400000
const at = (d: number, h: number) => { const t = new Date(Date.now() + d * day); t.setHours(h, 0, 0, 0); const p = (n: number) => String(n).padStart(2, '0'); return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}T${p(h)}:00` }
const SEED: Record<string, Record<string, Val>[]> = {
  jobs: [
    { title: 'Frontend Developer', location: 'Lahore', skills: 'react, typescript, css', status: 'Open', created: Date.now() - 6 * day },
    { title: 'Backend Developer', location: 'Remote', skills: 'node.js, sql, docker', status: 'Open', created: Date.now() - 4 * day },
    { title: 'Mobile App Developer', location: 'Karachi', skills: 'flutter, firebase', status: 'Closed', created: Date.now() - 20 * day },
  ],
  candidates: [
    { name: 'Erha Fatima', score: 88, status: 'Shortlisted', job: 'Frontend Developer', created: Date.now() - 1 * day },
    { name: 'Moiz Ahmed', score: 76, status: 'Interview', job: 'Backend Developer', created: Date.now() - 2 * day },
    { name: 'Haroon Ali', score: 64, status: 'Review', job: 'Frontend Developer', created: Date.now() - 3 * day },
    { name: 'sami Ullah', score: 41, status: 'Rejected', job: 'Mobile App Developer', created: Date.now() - 5 * day },
  ],
  interviews: [
    { candidate: 'Moiz Ahmad', job: 'Frontend Developer', date: at(1, 11), status: 'Scheduled' },
    { candidate: 'Erha Fatima', job: 'Backend Developer', date: at(3, 15), status: 'Scheduled' },
    { candidate: 'Alishba Malik', job: 'Frontend Developer', date: at(-2, 10), status: 'Done' },
  ],
  events: [{ title: 'Hiring sync', date: at(2, 10).slice(0, 10) }, { title: 'Career fair', date: at(7, 10).slice(0, 10) }],
  messages: [
    { subject: 'Welcome to the HireAI demo', body: 'This is sample data. Changes stay in your browser tab and disappear on refresh.', read: false, date: Date.now() - 3600000 },
    { subject: 'Interview scheduled with Erha Fatima', body: 'Tomorrow 11:00 for Frontend Developer', read: true, date: Date.now() - day },
  ],
}

function useDemoCol(name: string): Col {
  const [items, setItems] = useState<Item[]>(() => (SEED[name] ?? []).map((d, i) => ({ ...d, id: `demo-${name}-${i}` })))
  return {
    items,
    add: async (d) => { setItems((p) => [{ ...d, id: `demo-${name}-${Date.now()}-${p.length}` }, ...p]) },
    set: async (id, d) => { setItems((p) => p.map((x) => (x.id === id ? { ...x, ...d } : x))) },
    del: async (id) => { setItems((p) => p.filter((x) => x.id !== id)) },
  }
}

// Each user's data lives in users/{uid}/{name}. The demo user uses local sample data instead.
export function useCol(uid: string, name: string): Col {
  const demo = useDemoCol(name)
  const live = useFirestoreCol(uid, name)
  return uid === DEMO_UID ? demo : live
}

function useFirestoreCol(uid: string, name: string): Col {
  const [items, setItems] = useState<Item[]>([])
  useEffect(
    () => {
      if (uid === DEMO_UID) return
      return onSnapshot(collection(db, 'users', uid, name), (s) =>
        setItems(s.docs.map((d) => ({ ...(d.data() as Record<string, Val>), id: d.id }))),
      )
    },
    [uid, name],
  )
  return {
    items,
    add: (d) => addDoc(collection(db, 'users', uid, name), d),
    set: (id, d) => updateDoc(doc(db, 'users', uid, name, id), d),
    del: (id) => deleteDoc(doc(db, 'users', uid, name, id)),
  }
}
