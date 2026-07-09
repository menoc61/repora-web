import { useState, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useRegister } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import Icon from '../components/Icon'

const signupSchema = z
  .object({
    name: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(6, '6 caracteres minimum'),
    confirm: z.string().min(6, 'Confirmez votre mot de passe'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  })

type SignupValues = z.infer<typeof signupSchema>

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex relative w-[44%] bg-primary-container overflow-hidden flex-col justify-between"
      style={{ animation: 'panelSlideIn 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' }}
    >
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle at 100% 0%, rgba(37,99,235,0.5), transparent 70%)',
        }}
      />
      <div className="absolute bottom-0 left-0 w-96 h-96 opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle at 0% 100%, rgba(37,99,235,0.5), transparent 70%)',
        }}
      />

      <div className="relative z-10 p-14 pt-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-ai-vibrant/15 flex items-center justify-center">
            <Icon name="auto_awesome" className="text-ai-vibrant text-xl" />
          </div>
          <span className="font-headline text-white text-[14px] tracking-[0.3em] uppercase opacity-60">
            Repora
          </span>
        </div>

        <h1 className="font-headline text-white text-[42px] leading-[1.15] tracking-[-0.02em] font-bold mb-6">
          Rejoignez
          <br />
          <span className="text-ai-vibrant">Repora</span>
        </h1>

        <p className="font-body text-white/60 text-[17px] leading-relaxed max-w-md">
          Commencez a generer des documents techniques professionnels avec
          notre orchestration multi-agents. Inscription gratuite, demarrage
          immediat.
        </p>

        <div className="flex gap-6 mt-12">
          {[
            { label: 'Redaction', icon: 'edit_note' },
            { label: 'Diagrams', icon: 'schema' },
            { label: 'Export', icon: 'file_save' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <Icon name={item.icon} className="text-white/50 text-sm" />
              </div>
              <span className="font-label text-white/40 text-[11px] tracking-wider uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-14 pb-12">
        <div className="h-px bg-white/[0.06] mb-6" />
        <p className="font-label text-white/25 text-[10px] tracking-widest uppercase">
          v1.0 &mdash; Aucune carte bancaire requise
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const [mounted, setMounted] = useState(false)
  const [values, setValues] = useState<SignupValues>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignupValues, string>>>({})
  const [shake, setShake] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setErrors({})
    const { name, email, password } = parsed.data
    register.mutate({ name, email, password }, {
      onSuccess: () => navigate({ to: '/workspace' }),
      onError: () => {
        setShake(true)
        setTimeout(() => setShake(false), 500)
      },
    })
  }

  const formItemDelay = (i: number) =>
    mounted ? `${0.35 + i * 0.1}s` : '0s'

  return (
    <div className="min-h-screen flex bg-surface-studio">
      <BrandPanel />

      <div
        className="flex-1 flex items-center justify-center px-8 lg:px-16"
        style={{
          animation: 'formFadeUp 0.7s 0.2s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        }}
      >
        <div className="w-full max-w-[420px]">
          <div className="mb-10" style={{ animationDelay: formItemDelay(0) }}>
            <p className="font-label text-[11px] tracking-widest uppercase text-on-surface-variant/50 mb-4">
              Inscription
            </p>
            <h2 className="font-headline text-[28px] font-semibold text-primary tracking-[-0.01em]">
              Creer un compte
            </h2>
            <p className="font-body text-on-surface-variant/70 text-[15px] mt-1.5">
              Commencez a generer vos premiers documents
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className={shake ? 'animate-[shake_0.4s_ease]' : ''}
          >
            <div className="space-y-5">
              <div style={{ animationDelay: formItemDelay(1) }}>
                <label
                  htmlFor="name"
                  className="block font-label text-[11px] tracking-wider uppercase text-on-surface-variant/60 mb-2"
                >
                  Nom complet
                </label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  className="h-12 text-[15px] bg-surface-container-low border-surface-container-highest focus:border-ai-vibrant focus:ring-0 transition-all duration-200 rounded-lg"
                />
                {errors.name && (
                  <p className="text-xs text-error mt-1.5 font-label">{errors.name}</p>
                )}
              </div>

              <div style={{ animationDelay: formItemDelay(2) }}>
                <label
                  htmlFor="email"
                  className="block font-label text-[11px] tracking-wider uppercase text-on-surface-variant/60 mb-2"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jean@exemple.com"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  className="h-12 text-[15px] bg-surface-container-low border-surface-container-highest focus:border-ai-vibrant focus:ring-0 transition-all duration-200 rounded-lg"
                />
                {errors.email && (
                  <p className="text-xs text-error mt-1.5 font-label">{errors.email}</p>
                )}
              </div>

              <div style={{ animationDelay: formItemDelay(3) }}>
                <label
                  htmlFor="password"
                  className="block font-label text-[11px] tracking-wider uppercase text-on-surface-variant/60 mb-2"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Minimum 6 caracteres"
                    value={values.password}
                    onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
                    className="h-12 text-[15px] bg-surface-container-low border-surface-container-highest focus:border-ai-vibrant focus:ring-0 transition-all duration-200 rounded-lg pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors"
                    tabIndex={-1}
                  >
                    <Icon name={showPwd ? 'visibility_off' : 'visibility'} className="text-lg" />
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error mt-1.5 font-label">{errors.password}</p>
                )}
              </div>

              <div style={{ animationDelay: formItemDelay(4) }}>
                <label
                  htmlFor="confirm"
                  className="block font-label text-[11px] tracking-wider uppercase text-on-surface-variant/60 mb-2"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Resaisissez votre mot de passe"
                    value={values.confirm}
                    onChange={(e) => setValues((v) => ({ ...v, confirm: e.target.value }))}
                    className="h-12 text-[15px] bg-surface-container-low border-surface-container-highest focus:border-ai-vibrant focus:ring-0 transition-all duration-200 rounded-lg pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors"
                    tabIndex={-1}
                  >
                    <Icon name={showConfirm ? 'visibility_off' : 'visibility'} className="text-lg" />
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-xs text-error mt-1.5 font-label">{errors.confirm}</p>
                )}
              </div>

              {register.isError && (
                <div
                  className="text-[13px] text-error bg-error-container/50 px-4 py-3 rounded-lg font-body"
                  style={{ animationDelay: formItemDelay(5) }}
                >
                  {register.error?.message ?? "Echec de l'inscription"}
                </div>
              )}

              <div style={{ animationDelay: formItemDelay(5) }}>
                <Button
                  type="submit"
                  disabled={register.isPending}
                  className="w-full h-12 bg-primary-container hover:bg-primary-container/90 text-white font-headline text-[15px] font-semibold rounded-lg tracking-wide transition-all duration-200 hover:shadow-[0_8px_30px_-8px_rgba(19,27,46,0.4)] active:scale-[0.98]"
                >
                  {register.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creation...
                    </span>
                  ) : (
                    "Creer mon compte"
                  )}
                </Button>
              </div>
            </div>

            <div
              className="mt-8 text-center"
              style={{ animationDelay: formItemDelay(6) }}
            >
              <p className="font-body text-[14px] text-on-surface-variant/60">
                Deja un compte ?{' '}
                <Link
                  to="/login"
                  className="text-ai-vibrant hover:text-ai-vibrant/80 font-medium transition-colors underline decoration-ai-vibrant/20 underline-offset-4 hover:decoration-ai-vibrant"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes formFadeUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        form > div > *[style*="animationDelay"] {
          animation: formFadeUp 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
      `}</style>
    </div>
  )
}
