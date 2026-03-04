export type Profile = {
  id: string
  user_id: string
  username: string
  company_name: string
  one_liner: string
  stage: string
  traction: string
  ask: string
  needs: string | null        // comma-separated: funding,customers,hires,partnerships
  mrr: string | null
  users_count: string | null
  growth: string | null
  team: string | null
  links: string | null
  created_at: string
}

export type ConnectorProfile = {
  id: string
  user_id: string
  username: string
  name: string
  bio: string
  expertise: string           // comma-separated: SaaS,Fintech,AI
  helps_with: string          // comma-separated: investor_intros,hiring
  portfolio: string | null
  links: string | null
  created_at: string
}

export type IntroRequest = {
  id: string
  founder_user_id: string
  connector_user_id: string
  founder_username: string
  connector_username: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: 'new_request' | 'request_accepted' | 'request_declined'
  title: string
  body: string
  read: boolean
  request_id: string | null
  created_at: string
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return fallback
}

export const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B+'] as const

export const NEEDS_OPTIONS = [
  { value: 'funding', label: 'Funding' },
  { value: 'customers', label: 'Customers' },
  { value: 'hires', label: 'Hires' },
  { value: 'partnerships', label: 'Partnerships' },
] as const

export const EXPERTISE_OPTIONS = [
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Health', label: 'Health' },
  { value: 'AI', label: 'AI' },
  { value: 'Marketplace', label: 'Marketplace' },
] as const

export const HELPS_WITH_OPTIONS = [
  { value: 'investor_intros', label: 'Investor Intros' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'customer_intros', label: 'Customer Intros' },
  { value: 'strategy', label: 'Strategy' },
] as const
