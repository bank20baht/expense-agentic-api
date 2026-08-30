import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getToken } from './lib/auth.ts'
import { LoginPage } from './pages/LoginPage.tsx'
import { ExpensesPage } from './pages/ExpensesPage.tsx'

function RequireAuth({ children }: { children: ReactNode }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  return getToken() ? <Navigate to="/" replace /> : children
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <ExpensesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
