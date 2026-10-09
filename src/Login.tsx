import { useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, google } from './firebase'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  const go = async (fn: () => Promise<unknown>) => {
    setErr('')
    try {
      await fn()
    } catch (e) {
      setErr(e instanceof Error ? e.message.replace('Firebase: ', '') : 'Could not sign in.')
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    go(() => (mode === 'in' ? signInWithEmailAndPassword(auth, email, pass) : createUserWithEmailAndPassword(auth, email, pass)))
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <div className="logo dark"><span>H</span>HireAI</div>
        <h1>{mode === 'in' ? 'Sign in' : 'Create your account'}</h1>
        <label className="fld"><span>Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="fld"><span>Password</span><input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} /></label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn-pri" type="submit">{mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <button className="btn-out" type="button" onClick={() => go(() => signInWithPopup(auth, google))}>Continue with Google</button>
        <button className="link" type="button" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
