// app/api/clear-admin-cookie/route.ts

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_gate_passed')
  
  return NextResponse.json({ success: true })
}