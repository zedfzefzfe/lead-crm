import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Accounts are created by the admin in Supabase — there is no sign-up here.
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError('Email ou mot de passe incorrect.')
    setBusy(false)
  }

  return (
    <div className="min-h-screen grid place-items-center px-5 bg-gradient-to-b from-cream to-sand">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <p className="font-serif text-4xl text-center">Crea'rt</p>
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-gold mb-8">Workshops · CRM</p>

        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required className="input mb-4"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="label" htmlFor="password">Mot de passe</label>
        <input id="password" type="password" autoComplete="current-password" required className="input mb-5"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button className="btn-gold w-full" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </div>
  )
}
