import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import Icon from '../../components/Icon'

interface PromptHeroProps {
  prompt: string
  onPromptChange: (v: string) => void
  onGenerate: () => void
  generating: boolean
}

export default function PromptHero({ prompt, onPromptChange, onGenerate, generating }: PromptHeroProps) {
  return (
    <section className="mb-12 relative overflow-hidden rounded-xl bg-primary-container p-8 text-white min-h-[220px] flex flex-col justify-center">
      <div className="relative z-10 max-w-xl">
        <h2 className="font-headline-md text-headline-md font-black mb-2">Generer avec l&apos;Orchestrateur IA</h2>
        <p className="font-body-md opacity-80 mb-6">
          Decrivez vos besoins documentaires, et notre systeme multi-agents redige, verifie et formate votre cahier des charges automatiquement.
        </p>
        <div className="relative flex items-center">
          <Input
            className="w-full bg-white/10 border border-white/20 rounded-lg py-4 pl-5 pr-32 text-body-md placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-ai-vibrant/50 backdrop-blur-md"
            placeholder="Ex. : Rediger un cahier des charges pour une application de gestion de stock..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onGenerate() }}
          />
          <Button
            onClick={onGenerate}
            disabled={generating || !prompt.trim()}
            className="absolute right-2 bg-ai-vibrant hover:bg-secondary text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 transition-all"
          >
            {generating ? 'Creation...' : 'Generer'}
            <Icon name="bolt" className="text-[18px]" />
          </Button>
        </div>
      </div>
    </section>
  )
}
