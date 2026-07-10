import { Link } from '@tanstack/react-router'
import Icon from '../Icon'

export default function CreateTemplateCard() {
  return (
    <Link to="/editor" search={{ id: undefined }} className="group border-2 border-dashed border-outline-variant p-6 flex flex-col items-center justify-center text-center hover:border-secondary hover:bg-white transition-all cursor-pointer bg-surface-studio/50">
      <div className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center mb-4 group-hover:border-secondary group-hover:text-secondary">
        <Icon name="add" className="text-[32px]" />
      </div>
      <h3 className="font-headline-md text-[20px] mb-1 group-hover:text-secondary">Modele personnalise</h3>
      <p className="text-on-surface-variant font-body-sm">Creez votre propre logique d&apos;orchestration a partir de zero.</p>
    </Link>
  )
}
