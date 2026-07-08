import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuthStore } from '../stores'
import type { User } from '../schemas'

export interface AuthResponse {
  token: string
  user: { id: string; name: string; email: string; role: string }
}

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (creds: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', creds),
    onSuccess: (data) => {
      login({ name: data.user.name, email: data.user.email, role: data.user.role }, data.token)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useRegister() {
  const login = useAuthStore((s) => s.login)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string }) =>
      api.post<AuthResponse>('/auth/register', payload),
    onSuccess: (data) => {
      login({ name: data.user.name, email: data.user.email, role: data.user.role }, data.token)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => api.get<{ id: string; role: string }>('/auth/me'),
    enabled: useAuthStore.getState().isAuthenticated,
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => api.post<{ ok: boolean }>('/auth/logout'),
    onSettled: () => {
      logout()
      qc.clear()
    },
  })
}

export function useCurrentUser(): User | null {
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  return {
    id: '',
    name: user.name,
    email: user.email,
    role: user.role as User['role'],
  }
}