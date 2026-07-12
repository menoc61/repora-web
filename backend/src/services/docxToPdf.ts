import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'

let libreOfficePath: string | null = null

const COMMON_PATHS = [
  'soffice',
  'libreoffice',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  '/usr/bin/libreoffice',
  '/usr/local/bin/libreoffice',
]

function findLibreOffice(): string | null {
  if (libreOfficePath) return libreOfficePath
  for (const p of COMMON_PATHS) {
    try {
      execSync(`${p} --version`, { stdio: 'pipe', timeout: 5000 })
      libreOfficePath = p
      return p
    } catch {}
  }

  try {
    const result = execSync('which soffice 2>/dev/null || where soffice 2>nul', { encoding: 'utf-8', timeout: 5000 })
    const p = result.trim().split('\n')[0]
    if (p) {
      libreOfficePath = p
      return p
    }
  } catch {}

  return null
}

export function isLibreOfficeAvailable(): boolean {
  return findLibreOffice() !== null
}

export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const lo = findLibreOffice()
  if (!lo) {
    throw new Error(
      'LibreOffice est requis pour la conversion DOCX -> PDF. ' +
      'Installez LibreOffice (https://libreoffice.org) et redemarrez le serveur. ' +
      'Sinon, exportez directement en format .docx depuis l\'interface.'
    )
  }

  const tmpInput = path.join(tmpdir(), `repora-export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.docx`)
  const tmpOutputDir = path.join(tmpdir(), `repora-export-out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

  fs.mkdirSync(tmpOutputDir, { recursive: true })

  try {
    fs.writeFileSync(tmpInput, docxBuffer)

    execSync(
      `"${lo}" --headless --convert-to pdf --outdir "${tmpOutputDir}" "${tmpInput}"`,
      { stdio: 'pipe', timeout: 30000 }
    )

    const outputName = path.basename(tmpInput, '.docx') + '.pdf'
    const outputPath = path.join(tmpOutputDir, outputName)

    if (!fs.existsSync(outputPath)) {
      throw new Error('La conversion DOCX -> PDF a echoue: fichier de sortie introuvable')
    }

    return fs.readFileSync(outputPath)
  } finally {
    try { fs.unlinkSync(tmpInput) } catch {}
    try { fs.rmSync(tmpOutputDir, { recursive: true, force: true }) } catch {}
  }
}
