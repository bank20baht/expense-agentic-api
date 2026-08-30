import { useEffect, useState } from 'react'
import { api } from './lib/api.ts'
import { TextField, Button } from './ui.tsx'

type Expense = {
  id: number
  userId: number
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  date: string | Date // eden coerces ISO-date-looking strings into Date client-side
}

const TOKEN_KEY = 'expense-poc-token'

// Eden auto-parses date-looking JSON strings into `Date` objects, so
// `item.date` isn't reliably a string on the way back from the server.
const formatDate = (value: string | Date) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  return token ? (
    <ExpensesPage token={token} onLogout={() => setToken(null)} />
  ) : (
    <LoginPage onLogin={setToken} />
  )
}

function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const login = async () => {
    setError(null)
    const { data, error: err } = await api.api.auth.login.post({ username, password })
    if (err) return setError(err.value.message ?? 'Login failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    onLogin(data.token)
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

function ExpensesPage({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [type, setType] = useState<Expense['type']>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const authHeaders = { authorization: `Bearer ${token}` }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    onLogout()
  }

  const load = async () => {
    const { data, error: err } = await api.api.expenses.get({
      query: { limit: 50 },
      headers: authHeaders,
    })
    if (err?.status === 401) return logout()
    if (data) setExpenses(data.items)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState happens after an await, not synchronously
    void load()
  }, [])

  const create = async () => {
    setError(null)
    const amountNum = Number(amount)
    if (!category.trim() || !amountNum) return setError('Category and amount are required.')
    const { data, error: err } = await api.api.expenses.post(
      {
        type,
        amount: amountNum,
        category: category.trim(),
        note: note.trim() || undefined,
        date: new Date().toISOString().slice(0, 10),
      },
      { headers: authHeaders },
    )
    if (err) return setError(err.value.message ?? 'Could not add the record.')
    if (data) {
      setExpenses((prev) => [data, ...prev])
      setAmount('')
      setCategory('')
      setNote('')
    }
  }

  return (
    <main style={{ padding: 32, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ fontSize: 20 }}>Expense Tracker</h1>
        <Button onClick={logout}>log out</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Expense['type'])}
            style={{ padding: 8, fontSize: 14, borderRadius: 6, border: '1px solid #ccc' }}
          >
            <option value="expense">expense</option>
            <option value="income">income</option>
          </select>
          <TextField value={amount} onChange={setAmount} placeholder="amount" type="number" />
        </div>
        <TextField value={category} onChange={setCategory} placeholder="category" />
        <TextField value={note} onChange={setNote} onEnter={create} placeholder="note (optional)" />
        {error && <div style={{ color: 'crimson', fontSize: 13 }}>{error}</div>}
        <Button variant="primary" onClick={create}>
          add
        </Button>
      </div>

      <ul style={{ marginTop: 20, padding: 0, listStyle: 'none' }}>
        {expenses.map((item) => (
          <li
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{item.category}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {formatDate(item.date)}
                {item.note ? ` — ${item.note}` : ''}
              </div>
            </div>
            <div style={{ fontWeight: 600, color: item.type === 'income' ? '#16a34a' : '#dc2626' }}>
              {item.type === 'income' ? '+' : '-'}
              {item.amount}
            </div>
          </li>
        ))}
        {expenses.length === 0 && (
          <li style={{ padding: '10px 0', opacity: 0.6 }}>No records yet.</li>
        )}
      </ul>
    </main>
  )
}
