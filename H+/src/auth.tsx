import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, type AuthResponse, type AuthUser } from './api'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void api.get<{ utilisateur: AuthUser }>('/authentification/session')
      .then(({ utilisateur }) => { if (active) setUser(utilisateur) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.post('/authentification/deconnexion')
    } finally {
      setUser(null)
    }
  }, [])

  const signIn = useCallback(async (
    email: string,
    motDePasse: string,
  ) => {
    const response = await api.post<AuthResponse>('/authentification/connexion', {
      email,
      motDePasse,
    })
    if (!response.utilisateur) {
      throw new Error('La réponse de connexion est incomplète.')
    }
    setUser(response.utilisateur)
    return response
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,
    signIn,
    signOut,
  }), [user, ready, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
