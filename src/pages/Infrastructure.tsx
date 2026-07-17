import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import Icon from '../components/Icon'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useHealth, useInfraHealth, useEnableAgent } from '../hooks/useQueries'
import { RequireRole } from '../components/RequireRole'


interface InfraService {
  name: string
  status: string
  pid?: number
  extra?: string
}

interface InfraHealthResponse {
  status?: string
  services?: {
    api?: { status?: string }
    database?: { status?: string; latencyMs?: number }
    llama?: { status?: string }
  }
  system?: {
    hostname?: string
    platform?: string
    cpus?: number
    memoryTotalMb?: number
    memoryFreeMb?: number
    gpu?: string | null
  }
  client?: {
    ip?: string
    userAgent?: string
  }
  uptime?: number
  timestamp?: string
}

interface ClientInfo {
  browser: string
  os: string
  screen: string
  timezone: string
  language: string
  connection: string
  cores: number
  deviceMemory: string
  touchSupport: string
}

function detectClientInfo(): ClientInfo {
  const ua = navigator.userAgent
  let browser = 'Inconnu'
  if (ua.includes('Firefox/')) browser = `Firefox ${ua.split('Firefox/')[1]?.split(' ')[0] ?? ''}`
  else if (ua.includes('Edg/')) browser = `Edge ${ua.split('Edg/')[1]?.split(' ')[0] ?? ''}`
  else if (ua.includes('Chrome/')) browser = `Chrome ${ua.split('Chrome/')[1]?.split(' ')[0] ?? ''}`
  else if (ua.includes('Safari/') && ua.includes('Version/')) browser = `Safari ${ua.split('Version/')[1]?.split(' ')[0] ?? ''}`

  let os = 'Inconnu'
  if (ua.includes('Windows NT 10.')) os = 'Windows 10/11'
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1'
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X')) os = `macOS ${ua.split('Mac OS X ')[1]?.split(' ')[0]?.replace(/_/g, '.') ?? ''}`
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = `Android ${ua.split('Android ')[1]?.split(';')[0] ?? ''}`
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  const screenRes = `${screen.width}x${screen.height}`
  const colorDepth = screen.colorDepth
  const pixelRatio = window.devicePixelRatio

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const tzOffset = new Date().getTimezoneOffset()
  const offsetHours = Math.abs(Math.floor(tzOffset / 60))
  const offsetMins = Math.abs(tzOffset % 60)
  const tzSign = tzOffset <= 0 ? '+' : '-'

  const lang = navigator.language || navigator.languages?.[0] || 'Inconnu'

  let connection = 'Inconnu'
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (conn) {
    connection = `${conn.effectiveType ?? conn.type ?? 'inconnu'}`
    if (conn.downlink) connection += ` (${conn.downlink} Mbps)`
    if (conn.rtt != null) connection += ` — RTT ${conn.rtt}ms`
  } else if ('onLine' in navigator) {
    connection = navigator.onLine ? 'En ligne (type inconnu)' : 'Hors ligne'
  }

  const cores = navigator.hardwareConcurrency ?? 0

  let deviceMemory = 'Inconnu'
  if ('deviceMemory' in navigator) deviceMemory = `${(navigator as any).deviceMemory} GB`

  let touchSupport = 'Non'
  if ('maxTouchPoints' in navigator) {
    const pts = (navigator as any).maxTouchPoints as number
    touchSupport = pts > 0 ? `${pts} point${pts > 1 ? 's' : ''}` : 'Non'
  }

  return {
    browser,
    os,
    screen: `${screenRes} @${pixelRatio}x (${colorDepth}-bit)`,
    timezone: `${tz} (UTC${tzSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')})`,
    language: lang,
    connection,
    cores,
    deviceMemory,
    touchSupport,
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}j`)
  if (h > 0) parts.push(`${h}h`)
  parts.push(`${m}m`)
  return parts.join(' ')
}

function serviceIcon(status: string): string {
  const s = status.toLowerCase()
  if (['running', 'ok', 'healthy', 'active', 'online'].includes(s)) return 'check_circle'
  if (['warning', 'reindexing', 'degraded', 'starting'].includes(s)) return 'warning'
  if (['stopped', 'error', 'dead', 'offline'].includes(s)) return 'cancel'
  return 'help'
}

function serviceIconColor(status: string): string {
  const s = status.toLowerCase()
  if (['running', 'ok', 'healthy', 'active', 'online'].includes(s)) return 'text-status-final'
  if (['warning', 'reindexing', 'degraded', 'starting'].includes(s)) return 'text-status-review'
  if (['stopped', 'error', 'dead', 'offline'].includes(s)) return 'text-danger'
  return 'text-on-surface-variant'
}

export default function Infrastructure() {
  const { data: health, isLoading: healthLoading, error: healthError } = useHealth()
  const { data: infraHealth, isLoading: infraLoading, error: infraError } = useInfraHealth()
  const enableAgent = useEnableAgent()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)

  useEffect(() => {
    setClientInfo(detectClientInfo())
  }, [])

  const typedInfra = infraHealth as InfraHealthResponse | undefined

  const status = healthLoading
    ? 'CHARGEMENT...'
    : healthError
      ? 'INDISPONIBLE'
      : health?.status === 'ok'
        ? 'OPERATIONNEL'
        : 'INCONNU'



  // Map backend services object to array for display
  const servicesObj = typedInfra?.services
  const services: InfraService[] = servicesObj
    ? [
        { name: 'API Repora', status: servicesObj.api?.status ?? 'unknown' },
        { name: 'Base de donnees', status: servicesObj.database?.status ?? 'unknown', extra: servicesObj.database?.latencyMs != null ? `${servicesObj.database.latencyMs}ms` : undefined },
        { name: 'LLM (Ollama)', status: servicesObj.llama?.status ?? 'unknown' },
      ]
    : []

  const instanceHostname = typedInfra?.system?.hostname ?? 'Repora-Alpha-01'
  const instancePlatform = typedInfra?.system?.platform ?? '—'
  const instanceCpus = typedInfra?.system?.cpus ?? 0
  const memoryTotalMb = typedInfra?.system?.memoryTotalMb ?? 0
  const memoryFreeMb = typedInfra?.system?.memoryFreeMb ?? 0
  const memoryPct = memoryTotalMb > 0 ? Math.round(((memoryTotalMb - memoryFreeMb) / memoryTotalMb) * 100) : 0
  const instanceVersion = '—'
  const instanceLocation = '—'
  const instanceMode = 'HEBERGE-LOCAL'
  const instanceUptime = typedInfra?.uptime != null ? formatUptime(typedInfra.uptime) : '—'

  const hasGpu = typedInfra?.system?.gpu != null
  const gpuName = typedInfra?.system?.gpu ?? '—'
  const gpuActive = hasGpu
  const gpuUtil = 0
  const gpuVramUsed = 0
  const gpuVramTotal = 0
  const gpuVramPct = 0
  const storagePct = memoryPct
  const storageName = 'Stockage local'
  const storageTotal = `${Math.round(memoryTotalMb / 1024)} GB`
  const storageIowait = '—'
  const loadHistory: number[] = [45, 62, 38, 55, 71, 48, 52, 43, 39, 58, 63, 47, 51, 44, 49, 56, 61, 42, 50, 54, 46, 53, 40, 57]
  const filteredServices = services.filter((s) =>
    searchTerm ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  )

  const handleDeployAgent = () => {
    enableAgent.mutate('Orchestrateur')
  }

  const strokeDash = 2 * Math.PI * 58
  const strokeOffset = strokeDash * (1 - storagePct / 100)

  return (
    <RequireRole role={['admin', 'super_admin']}>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 flex justify-between items-center px-gutter bg-surface-studio border-b border-outline-variant z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center bg-surface-container rounded-lg px-3 py-1.5 w-64 border border-outline-variant focus-within:border-secondary transition-colors">
              <Icon name="search" className="text-on-surface-variant text-[20px]" />
              <Input
                className="border-none bg-transparent focus-visible:ring-0 p-0 text-body-sm w-full"
                placeholder="Rechercher infrastructure..."
                value={searchTerm}
                onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
              />
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/workspace" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">Espace de travail</Link>
              <Link to="/library" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">Bibliotheque</Link>
              <Link to="/agents" className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors">Agents</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-label-md font-bold active:opacity-80 transition-opacity" onClick={handleDeployAgent} disabled={enableAgent.isPending}>
              {enableAgent.isPending ? 'Deploiement...' : 'Deployer un agent'}
            </Button>
            <Link to="/settings" className="text-on-surface-variant hover:text-secondary p-1">
              <Icon name="settings" />
            </Link>
            <button className="text-on-surface-variant hover:text-secondary p-1" onClick={() => alert('Fonctionnalite a venir')}><Icon name="notifications" /></button>
            <button className="text-on-surface-variant hover:text-secondary p-1" onClick={() => navigate({ to: '/settings' })}><Icon name="account_circle" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-surface-studio">
          <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6">
            <div className="col-span-12 flex items-center justify-between bg-white p-6 rounded-xl border border-outline-variant">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${healthLoading ? 'bg-warning animate-pulse' : healthError ? 'bg-danger' : health?.status === 'ok' ? 'bg-status-final animate-pulse' : 'bg-status-review'}`} />
                <div>
                  <h2 className="font-headline-md text-headline-md leading-tight">
                    {infraLoading
                      ? 'Chargement...'
                      : infraError
                        ? 'Instance indisponible'
                        : `Noeud d'instance : ${instanceHostname}`}
                  </h2>
                  <p className="text-on-surface-variant text-body-sm">
                    {status} &bull; Disponibilite : {instanceUptime} &bull; Localisation : {instanceLocation}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-on-surface-variant">
                  V {instanceVersion}
                </span>
                <span className="px-3 py-1 bg-ai-glow text-secondary rounded-full text-label-sm font-label-sm">
                  {instanceMode}
                </span>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-[320px]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Statut GPU</p>
                  <h3 className="font-headline-md text-headline-md mt-1">{hasGpu ? gpuName : 'Aucun GPU detecte'}</h3>
                </div>
                <Icon name="smart_toy" className="text-secondary text-3xl" />
              </div>
              {infraLoading ? (
                <div className="flex-1 flex items-center justify-center text-on-surface-variant text-body-sm">
                  Chargement...
                </div>
              ) : !hasGpu ? (
                <div className="flex-1 flex items-center justify-center text-on-surface-variant text-body-sm">
                  Donnees GPU indisponibles
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-body-sm font-medium">Utilisation GPU</span>
                      <span className="text-label-sm font-label-sm text-secondary">{gpuUtil}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${gpuUtil}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-body-sm font-medium">Allocation VRAM</span>
                      <span className="text-label-sm font-label-sm text-status-review">
                        {gpuVramUsed} / {gpuVramTotal} GB
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-status-review h-full rounded-full transition-all duration-1000" style={{ width: `${gpuVramPct}%` }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Icon
                  name={gpuActive ? 'check_circle' : 'cancel'}
                  className={`text-sm ${gpuActive ? 'text-status-final' : 'text-on-surface-variant'}`}
                  fill
                />
                <span className="text-label-sm font-label-sm">
                  {gpuActive ? 'Inference active' : 'Inference inactive'}
                </span>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-[320px]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Persistance locale</p>
                  <h3 className="font-headline-md text-headline-md mt-1">{storageName}</h3>
                </div>
                <Icon name="database" className="text-on-surface-variant text-3xl" />
              </div>
              {infraLoading ? (
                <div className="flex flex-col items-center justify-center py-4 text-on-surface-variant text-body-sm">
                  Chargement...
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container" />
                      <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={strokeDash} strokeDashoffset={strokeOffset} className="text-secondary transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-headline-md font-bold">{storagePct}%</span>
                      <span className="text-[10px] font-label-sm text-on-surface-variant">CAPACITE</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 border-t border-outline-variant pt-4">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-label-sm">Taille totale</p>
                  <p className="font-bold text-body-md">{storageTotal}</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-label-sm">Attente E/S</p>
                  <p className="font-bold text-body-md">{storageIowait}</p>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-headline-md">Services</h3>
                <Button variant="link" className="text-on-surface-variant text-body-sm font-medium p-0 h-auto cursor-not-allowed opacity-40" disabled>
                  Redemarrage reserve
                </Button>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {infraLoading ? (
                  <div className="flex items-center justify-center h-full text-on-surface-variant text-body-sm">
                    Chargement...
                  </div>
                ) : infraError ? (
                   <div className="flex items-center justify-center h-full text-danger text-body-sm">
                    Erreur de chargement des services
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-on-surface-variant text-body-sm">
                    Aucun service trouve
                  </div>
                ) : (
                  filteredServices.map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-studio">
                      <div className="flex items-center gap-3">
                        <Icon name={serviceIcon(s.status)} className={serviceIconColor(s.status)} />
                        <span className="font-medium text-body-sm">{s.name}</span>
                      </div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">
                        {s.extra ?? (s.pid != null ? `PID: ${s.pid}` : '')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-outline-variant flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline-md text-headline-md">Client Connecte</h3>
                <Icon name="computer" className="text-secondary text-2xl" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 text-body-sm">
                {clientInfo ? (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-variant">Navigateur</span>
                      <span className="font-medium text-right">{clientInfo.browser}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-variant">OS</span>
                      <span className="font-medium text-right">{clientInfo.os}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-variant">Ecran</span>
                      <span className="font-medium text-right">{clientInfo.screen}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-variant">Fuseau horaire</span>
                      <span className="font-medium text-right text-[11px]">{clientInfo.timezone}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-variant">Langue</span>
                      <span className="font-medium">{clientInfo.language}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-variant">Reseau</span>
                      <span className="font-medium text-right text-[11px]">{clientInfo.connection}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-variant">Coeurs CPU</span>
                      <span className="font-medium">{clientInfo.cores}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant">
                      <span className="text-on-surface-zone">Memoire device</span>
                      <span className="font-medium">{clientInfo.deviceMemory}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-on-surface-variant">Toucher</span>
                      <span className="font-medium">{clientInfo.touchSupport}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-on-surface-variant">
                    Detection en cours...
                  </div>
                )}
              </div>
              {typedInfra?.client && (
                <div className="mt-2 pt-2 border-t border-outline-variant space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">IP client</span>
                    <span className="font-mono font-medium">{typedInfra.client.ip}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-12 bg-on-surface p-6 rounded-xl border border-on-surface shadow-2xl h-[400px] flex flex-col font-label-sm text-label-sm">
              <div className="flex items-center justify-between mb-4 border-b border-on-surface-variant pb-2">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-danger" />
                     <div className="w-3 h-3 rounded-full bg-warning" />
                     <div className="w-3 h-3 rounded-full bg-success" />
                  </div>
                  <span className="text-white opacity-60">system@repora-alpha-01: /var/log</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-status-final">STATISTIQUES SYSTEME</span>
                  <span className="text-white opacity-40">UTF-8</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 text-green-400 font-mono custom-scrollbar grid grid-cols-2 gap-x-8 gap-y-2">
                {infraLoading ? (
                  <div className="col-span-2 flex items-center justify-center h-full text-white/50">
                    Chargement...
                  </div>
                ) : infraError ? (
                  <div className="col-span-2 flex items-center justify-center h-full text-danger">
                    Erreur de chargement
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4"><span className="text-blue-400">HOSTNAME</span><span>{instanceHostname}</span></div>
                    <div className="flex gap-4"><span className="text-blue-400">PLATFORM</span><span>{instancePlatform}</span></div>
                    <div className="flex gap-4"><span className="text-blue-400">CPUS</span><span>{instanceCpus}</span></div>
                    <div className="flex gap-4"><span className="text-blue-400">MEMORY TOTAL</span><span>{Math.round(memoryTotalMb / 1024)} GB</span></div>
                    <div className="flex gap-4"><span className="text-blue-400">MEMORY FREE</span><span>{Math.round(memoryFreeMb / 1024)} GB</span></div>
                    <div className="flex gap-4"><span className="text-blue-400">UPTIME</span><span>{instanceUptime}</span></div>
                    <div className="flex gap-4"><span className="text-blue-400">GPU</span><span>{gpuName}</span></div>
                    <div className="flex gap-4"><span className="text-blue-400">MODE</span><span>{instanceMode}</span></div>
                    {typedInfra?.client?.ip && <div className="flex gap-4"><span className="text-yellow-400">CLIENT IP</span><span>{typedInfra.client.ip}</span></div>}
                    {clientInfo && <div className="flex gap-4"><span className="text-yellow-400">BROWSER</span><span>{clientInfo.browser}</span></div>}
                    {clientInfo && <div className="flex gap-4"><span className="text-yellow-400">CLIENT OS</span><span>{clientInfo.os}</span></div>}
                    {clientInfo && <div className="flex gap-4"><span className="text-yellow-400">SCREEN</span><span>{clientInfo.screen}</span></div>}
                    {clientInfo && <div className="flex gap-4"><span className="text-yellow-400">TIMEZONE</span><span>{clientInfo.timezone}</span></div>}
                    {clientInfo && <div className="flex gap-4"><span className="text-yellow-400">NETWORK</span><span>{clientInfo.connection}</span></div>}
                    {clientInfo && <div className="flex gap-4"><span className="text-yellow-400">CPU CORES</span><span>{clientInfo.cores}</span></div>}
                  </>
                )}
              </div>
              <div className="mt-4 pt-2 border-t border-on-surface-variant flex gap-2">
                <span className="text-status-final">$</span>
                <span className="text-white/50 font-mono">Diagnostic termine — systeme operationnel</span>
              </div>
            </div>

            <div className="col-span-12 bg-white p-6 rounded-xl border border-outline-variant">
              <h3 className="font-headline-md text-headline-md mb-6">Charge systeme active (24h)</h3>
              {infraLoading ? (
                <div className="flex items-center justify-center h-24 text-on-surface-variant text-body-sm">
                  Chargement...
                </div>
              ) : loadHistory.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-on-surface-variant text-body-sm">
                  Donnees de charge indisponibles
                </div>
              ) : (
                <div className="flex gap-1 h-24 items-end">
                  {loadHistory.map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${h > 80 ? 'bg-error' : h > 60 ? 'bg-status-review' : 'bg-secondary'} opacity-40 hover:opacity-100 transition-opacity rounded-t-sm`}
                      style={{ height: `${Math.min(h, 100)}%` }}
                    />
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-2 text-[10px] font-label-sm text-on-surface-variant uppercase">
                <span>Il y a 24 heures</span>
                <span>Il y a 12 heures</span>
                <span>A l&apos;instant</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireRole>
  )
}
