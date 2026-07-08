import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useRegister } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import Icon from '../components/Icon'

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string().min(6, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type SignupValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const [values, setValues] = useState<SignupValues>({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof SignupValues, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = signupSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof SignupValues, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SignupValues
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    const { name, email, password } = parsed.data
    register.mutate({ name, email, password }, {
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
          <h1 className="font-headline-lg text-primary">Create your account</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Start generating AI-native documents</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-outline-variant p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Alex Chen"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
            {errors.name && <p className="text-xs text-status-review">{errors.name}</p>}
          </div>

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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={values.password}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            />
            {errors.password && <p className="text-xs text-status-review">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={values.confirm}
              onChange={(e) => setValues((v) => ({ ...v, confirm: e.target.value }))}
            />
            {errors.confirm && <p className="text-xs text-status-review">{errors.confirm}</p>}
          </div>

          {register.isError && (
            <p className="text-xs text-status-review">
              {register.error?.message ?? 'Registration failed'}
            </p>
          )}

          <Button type="submit" disabled={register.isPending} className="w-full">
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-ai-vibrant hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}