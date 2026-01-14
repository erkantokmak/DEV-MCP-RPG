import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api, { User } from '../services/api'

interface UserContextType {
  currentUser: User | null
  loading: boolean
  error: string | null
  login: (username: string) => Promise<void>
  logout: () => void
  register: (data: { username: string; email?: string; display_name?: string }) => Promise<void>
  setCurrentUser: (user: User | null) => void
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Local storage keys
const STORAGE_KEY = 'dev_rpg_user'

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user from local storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const userData = JSON.parse(stored)
          // Verify user still exists and refresh data
          try {
            const freshUser = await api.getUser(userData.id)
            setCurrentUser(freshUser)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser))
          } catch {
            // User no longer exists or API error
            localStorage.removeItem(STORAGE_KEY)
            setCurrentUser(null)
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (username: string) => {
    setLoading(true)
    setError(null)
    try {
      // Since backend doesn't have auth endpoint, we'll find user by username
      const users = await api.listUsers(100, 0)
      const user = users.find(u => u.username === username)
      
      if (!user) {
        throw new Error('User not found')
      }
      
      setCurrentUser(user)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const register = async (data: { username: string; email?: string; display_name?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const newUser = await api.createUser({
        username: data.username,
        email: data.email || `${data.username}@dev-rpg.local`,
        password: 'not-used', // Backend requires but doesn't verify
        display_name: data.display_name,
      })
      setCurrentUser(newUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (!currentUser) return
    
    try {
      const freshUser = await api.getUser(currentUser.id)
      setCurrentUser(freshUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser))
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        error,
        login,
        logout,
        register,
        setCurrentUser,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
