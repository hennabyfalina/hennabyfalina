// src/app/auth/auth-code-error/page.tsx

import { redirect } from 'next/navigation'

export default function AuthCodeErrorPage() {
  redirect('/login')
}
