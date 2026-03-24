import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY no está configurada en .env.local')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'onboarding@resend.dev'
export const APP_NAME   = 'AGENTME'