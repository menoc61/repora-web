import { useState, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useLogin } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import Icon from '../components/Icon'

const DEV_ACCOUNTS = [
  { label: '[DEV] Administrateur', email: 'admin@repora.dev', password: 'admin123' },
  { label: '[DEV] Redacteur', email: 'jean@exemple.com', password: 'test123' },
  { label: '[DEV] Validateur', email: 'client@exemple.com', password: 'client123' },
]

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, '6 caracteres minimum'),
})

type LoginValues = z.infer<typeof loginSchema>

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
          Cahier des Charges
          <br />
          <span className="text-ai-vibrant">Intelligent</span>
        </h1>

        <p className="font-body text-white/60 text-[17px] leading-relaxed max-w-md">
          Generez, structurez et validez vos documents techniques avec une
          orchestration multi-agents. Precision professionnelle, confidentialite
          garantie.
        </p>

        <div className="flex gap-6 mt-12">
          {[
            { label: 'Generation', icon: 'auto_awesome' },
            { label: 'Diagrams', icon: 'account_tree' },
            { label: 'Validation', icon: 'verified' },
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
          v1.0 &mdash; TETRATECH SERVICES SARL
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [mounted, setMounted] = useState(false)
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>>>({})
  const [shake, setShake] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setErrors({})
    login.mutate(parsed.data, {
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
              Connexion
            </p>
            <h2 className="font-headline text-[28px] font-semibold text-primary tracking-[-0.01em]">
              Bienvenue
            </h2>
            <p className="font-body text-on-surface-variant/70 text-[15px] mt-1.5">
              Accedez a votre espace de travail Repora
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className={shake ? 'animate-[shake_0.4s_ease]' : ''}
          >
            <div className="space-y-5">
              <div style={{ animationDelay: formItemDelay(1) }}>
                <label
                  htmlFor="dev-account"
                  className="block font-label text-[11px] tracking-wider uppercase text-on-surface-variant/60 mb-2"
                >
                  Compte de test
                </label>
                <select
                  id="dev-account"
                  onChange={(e) => {
                    const acc = DEV_ACCOUNTS[parseInt(e.target.value)]
                    if (acc) setValues({ email: acc.email, password: acc.password })
                  }}
                  defaultValue=""
                  className="w-full h-12 text-[15px] bg-surface-container-low border border-surface-container-highest rounded-lg px-4 text-on-surface-variant/70 focus:border-ai-vibrant focus:ring-0 transition-all duration-200 outline-none appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2376777d' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: '40px' }}
                >
                  <option value="">-- Choisir un compte --</option>
                  {DEV_ACCOUNTS.map((a, i) => (
                    <option key={i} value={i}>{a.label}</option>
                  ))}
                </select>
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
                  placeholder="vous@exemple.com"
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
                    autoComplete="current-password"
                    placeholder="••••••••"
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

              {login.isError && (
                <div
                  className="text-[13px] text-error bg-error-container/50 px-4 py-3 rounded-lg font-body"
                  style={{ animationDelay: formItemDelay(3) }}
                >
                  {login.error?.message ?? 'Identifiants invalides'}
                </div>
              )}

              <div style={{ animationDelay: formItemDelay(3) }}>
                <Button
                  type="submit"
                  disabled={login.isPending}
                  className="w-full h-12 bg-primary-container hover:bg-primary-container/90 text-white font-headline text-[15px] font-semibold rounded-lg tracking-wide transition-all duration-200 hover:shadow-[0_8px_30px_-8px_rgba(19,27,46,0.4)] active:scale-[0.98]"
                >
                  {login.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </div>
            </div>

            <div
              className="mt-8 text-center"
              style={{ animationDelay: formItemDelay(4) }}
            >
              <p className="font-body text-[14px] text-on-surface-variant/60">
                Pas encore de compte ?{' '}
                <Link
                  to="/signup"
                  className="text-ai-vibrant hover:text-ai-vibrant/80 font-medium transition-colors underline decoration-ai-vibrant/20 underline-offset-4 hover:decoration-ai-vibrant"
                >
                  Creer un compte
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
        form > div > *[style*="animationDelay"],
        form > div > div[style*="animationDelay"] {
          animation: formFadeUp 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
      `}</style>
    </div>
  )
}
