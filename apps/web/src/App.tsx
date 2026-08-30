import { useEffect, useState } from 'react'
import { api } from './lib/api.ts'
import { CheckField, TextField } from './ui.tsx'
import { dialog, toast } from 'uibank/overlay' // imperative modal + toast, called from JS
import 'uibank'
import 'uibank/react' // JSX typings for <ub-*>
import 'uibank/tokens.css'

type Todo = { id: number; title: string; done: boolean }

export function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  // Cursor pagination: first page has no cursor, `loadMore` re-fetches with
  // the cursor the server handed back and appends onto the existing list.
  const loadPage = async (cursor?: string) => {
    const { data } = await api.api.todos.get({ query: { cursor, limit: 20 } })
    if (!data) return
    setTodos((prev) => (cursor ? [...prev, ...data.items] : data.items))
    setNextCursor(data.nextCursor)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState happens after an await, not synchronously
    void loadPage()
  }, [])

  // Shared create: POST + optimistic state + toast feedback.
  const create = async (t: string) => {
    // Body typed: `{ title: string }` required, enforced at compile + runtime.
    const { data, error } = await api.api.todos.post({ title: t })
    if (error) return void dialog.error(error.value.message ?? 'Could not add the todo.') // error.value typed by status code
    if (data) {
      setTodos((prev) => [...prev, data])
      setTitle('')
      toast.success(`Added “${data.title}”`)
    }
  }

  // Enter in the field adds inline.
  const add = () => title.trim() && create(title.trim())

  // Button click opens the overlay modal imperatively (no markup needed).
  const addViaModal = async () => {
    const value = title.trim()
    if (!value) return void dialog.alert('Type a todo first.')
    const ok = await dialog.confirm(`Add “${value}” to the list?`, {
      title: 'New todo',
      confirmText: 'Add',
    })
    if (ok) create(value)
  }

  const toggle = async (todo: Todo) => {
    // Params typed as number; body fields optional.
    const { data } = await api.api.todos({ id: todo.id }).patch({
      done: !todo.done,
    })
    if (data) setTodos((prev) => prev.map((t) => (t.id === data.id ? data : t)))
  }

  return (
    <main style={{ padding: 32, maxWidth: 480, margin: '0 auto' }}>
      <ub-card heading="Bun Monorepo — React + Elysia" subtitle="Todos">
        <div style={{ display: 'flex', gap: 8 }}>
          <TextField
            value={title}
            onChange={setTitle}
            onEnter={() => title && add()}
            placeholder="new todo"
          />
          <ub-button variant="primary" onClick={addViaModal}>
            add
          </ub-button>
        </div>

        <div style={{ marginTop: 16 }}>
          {todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
              }}
            >
              <CheckField checked={todo.done} label={todo.title} onChange={() => toggle(todo)} />
              <ub-badge
                style={{ marginLeft: 'auto' }}
                tone={todo.done ? 'success' : 'neutral'}
                label={todo.done ? 'done' : 'todo'}
              />
            </div>
          ))}
        </div>

        {nextCursor && (
          <ub-button style={{ marginTop: 16 }} onClick={() => loadPage(nextCursor)}>
            load more
          </ub-button>
        )}
      </ub-card>
    </main>
  )
}
