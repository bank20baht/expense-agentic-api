import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import { setToken } from '../lib/auth.ts'
import { TextField, Button } from '../ui.tsx'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const login = async () => {
    setError(null)
    const { data, error: err } = await api.api.auth.login.post({ username, password })
    if (err) return setError(err.value.message ?? 'Login failed')
    setToken(data.token)
    navigate('/', { replace: true })
  }

  return (
    <main style={{ padding: 32, maxWidth: 360, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>Expense Tracker</h1>
      <p style={{ fontSize: 13, opacity: 0.6, marginTop: -8 }}>Sign in</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        <TextField value={username} onChange={setUsername} placeholder="username" />
        <TextField
          value={password}
          onChange={setPassword}
          onEnter={login}
          placeholder="password"
          type="password"
        />
        {error && <div style={{ color: 'crimson', fontSize: 13 }}>{error}</div>}
        <Button variant="primary" onClick={login}>
          log in
        </Button>
        <div style={{ fontSize: 12, opacity: 0.6 }}>demo users: alice/alice123, bob/bob123</div>
      </div>
    </main>
  )
}
