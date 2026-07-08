import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useLogin } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import Icon from '../components/Icon'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LoginValues, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LoginValues
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    login.mutate(parsed.data, {
      onSuccess: () => navigate({ to: '/workspace' }),
    })
  }

  return (
    <div className="min-h-screen bg-surface-studio flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-4">
            <Icon name="auto_awesome" className="text-ai-vibrant text-2xl" />
          </div>
          <h1 className="font-headline-lg text-primary">Welcome back</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Sign in to your Repora workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-outline-variant p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
            {errors.email && <p className="text-xs text-status-review">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.password}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            />
            {errors.password && <p className="text-xs text-status-review">{errors.password}</p>}
          </div>

          {login.isError && (
            <p className="text-xs text-status-review">
              {login.error?.message ?? 'Invalid credentials'}
            </p>
          )}

          <Button type="submit" disabled={login.isPending} className="w-full">
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center text-sm text-on-surface-variant">
            No account?{' '}
            <Link to="/signup" className="text-ai-vibrant hover:underline font-medium">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}