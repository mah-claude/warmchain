/** Profile as stored in Supabase and displayed on public profile page */
export type Profile = {
  username: string
  company_name: string
  one_liner: string
  stage: string
  traction: string
  ask: string
  team: string | null
  links: string | null
}

/** Extract a user-facing error message from unknown catch value */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return fallback
}
