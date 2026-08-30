import { authRepository } from './auth.repository'
import type { Result } from '../../shared/types/error.type'

export const authService = {
  verifyCredentials: (
    username: string,
    password: string,
  ): Result<{ id: number; username: string }> => {
    const user = authRepository.findByUsername(username)
    if (!user || user.password !== password) return { ok: false, error: 'INVALID_CREDENTIALS' }
    return { ok: true, data: { id: user.id, username: user.username } }
  },
}
