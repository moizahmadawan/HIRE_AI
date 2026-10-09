
import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

type Val = string | number | boolean

export type Item = {
  id: string
} & Record<string, Val>

export type Col = {
  items: Item[]
  add: (data: Record<string, Val>) => Promise<unknown>
  set: (id: string, data: Record<string, Val>) => Promise<void>
  del: (id: string) => Promise<void>
  put: (id: string, data: Record<string, Val>) => Promise<void>
  loading: boolean
  error: string | null
}

export function useCol(uid: string, name: string): Col {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setItems([])
    setError(null)

    if (!uid) {
      setLoading(false)
      setError('User login nahi hai.')
      return
    }

    setLoading(true)

    const ref = collection(db, 'users', uid, name)

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setItems(
          snapshot.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          })) as Item[],
        )
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(`Firestore read error (${name}):`, err)
        setError(err.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [uid, name])

  const runWrite = useCallback(
    async (operation: () => Promise<unknown>) => {
      try {
        const result = await operation()
        setError(null)
        return result
      } catch (err) {
        console.error(`Firestore write error (${name}):`, err)

        const message =
          err instanceof Error ? err.message : 'Unknown Firebase error'

        setError(message)
        window.alert(`Firebase error (${name}): ${message}`)
        throw err
      }
    },
    [name],
  )

  const add = useCallback(
    (data: Record<string, Val>) =>
      runWrite(() =>
        addDoc(collection(db, 'users', uid, name), data),
      ),
    [uid, name, runWrite],
  )

  const set = useCallback(
    (id: string, data: Record<string, Val>) =>
      runWrite(() =>
        updateDoc(doc(db, 'users', uid, name, id), data),
      ).then(() => undefined),
    [uid, name, runWrite],
  )

  const del = useCallback(
    (id: string) =>
      runWrite(() =>
        deleteDoc(doc(db, 'users', uid, name, id)),
      ).then(() => undefined),
    [uid, name, runWrite],
  )

  const put = useCallback(
    (id: string, data: Record<string, Val>) =>
      runWrite(() =>
        setDoc(doc(db, 'users', uid, name, id), data, {
          merge: true,
        }),
      ).then(() => undefined),
    [uid, name, runWrite],
  )

  return { items, loading, error, add, set, del, put }
}