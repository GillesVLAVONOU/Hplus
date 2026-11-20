import { createContext, useContext } from 'react'
import type { AuthResponse, AuthUser } from './api'

export interface AuthContextValue {
  user: AuthUser | null
  ready: boolean
  signIn: (email: string, motDePasse: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.')
  return context
}
