type User = { id: number; username: string; password: string }

// POC only — plaintext passwords, in-memory. Swap for a hashed column + real
// DB before this ever sees production traffic.
const users: User[] = [
  { id: 1, username: 'alice', password: 'alice123' },
  { id: 2, username: 'bob', password: 'bob123' },
]

export const authRepository = {
  findByUsername: (username: string): User | undefined =>
    users.find((user) => user.username === username),
}
