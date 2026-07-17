import type { DevCredentialKind } from '@/types'

export const credentialTypes: Array<{ value: DevCredentialKind; label: string }> = [
  { value: 'api_key', label: 'API Key' },
  { value: 'database', label: 'Database User' },
  { value: 'connection_string', label: 'Connection String' },
  { value: 'login', label: 'Login' },
  { value: 'oauth_client', label: 'OAuth Client' },
  { value: 'webhook_secret', label: 'Webhook Secret' },
  { value: 'ssh_key', label: 'SSH Key' },
]

export const environments = ['dev', 'local', 'staging', 'qa', 'prod', 'sandbox'] as const

export function isEnvFileKind(kind?: string) {
  return kind === 'env_file' || kind === 'env_var'
}

export function usesMultilineSecret(kind?: string) {
  return kind === 'ssh_key' || kind === 'connection_string' || isEnvFileKind(kind)
}

export function maskEnvContent(content: string) {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('#')) return line
      const eq = line.indexOf('=')
      if (eq === -1) return '••••••••••••'
      return `${line.slice(0, eq + 1)}••••••••••••`
    })
    .join('\n')
}

export function credentialLabel(kind?: string) {
  if (isEnvFileKind(kind)) return 'Env file (.env)'
  return credentialTypes.find((item) => item.value === kind)?.label ?? 'Entry'
}

export function environmentLabel(value?: string) {
  return value ? value.toUpperCase() : 'DEV'
}

export function defaultEnvFileName(environment: string) {
  return environment === 'prod' ? 'Production .env' : `${environmentLabel(environment)} .env`
}

export function entryCountLabel(count: number) {
  return `${count} ${count === 1 ? 'entry' : 'entries'}`
}
