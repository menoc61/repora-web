import { useParams } from '@tanstack/react-router'
import OnboardingWizardView from '../components/onboarding'

export default function OnboardingWizard() {
  const { id } = useParams({ from: '/onboarding/$id' as any, strict: false }) as { id?: string }
  return <OnboardingWizardView projectId={id} />
}
