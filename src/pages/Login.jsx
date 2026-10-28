import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CLIENT } from '../lib/constants'

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
    <div className="grid min-h-screen place-items-center bg-cream px-5">
      <form onSubmit={submit} className="card w-full max-w-sm p-7">
        {CLIENT.brand.logo ? (
          <img src={CLIENT.brand.logo} alt={CLIENT.brand.name} className="h-auto w-full" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gold text-[17px] font-bold text-white">
            {CLIENT.brand.name[0]}
          </span>
        )}
        <h1 className="mt-6 text-[20px] font-semibold tracking-tight">Connexion</h1>
        <p className="mb-6 mt-0.5 text-[13px] text-muted">{CLIENT.brand.name} · {CLIENT.brand.tagline}</p>

        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required className="input mb-4"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="label" htmlFor="password">Mot de passe</label>
        <input id="password" type="password" autoComplete="current-password" required className="input mb-5"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}

        <button className="btn-gold w-full" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </div>
  )
}
