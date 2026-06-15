'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

export default function NameModal({ userId, email, onComplete }: { userId: string, email: string, onComplete: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (email.toLowerCase().trim() === 'razorpay@hennabyfalina.com') {
      onComplete()
    } else {
      setMounted(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  if (!mounted || email.toLowerCase().trim() === 'razorpay@hennabyfalina.com') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')
    const supabase = createClient()

    // 1. Update auth metadata so the session knows the name immediately
    const { error: authError } = await supabase.auth.updateUser({
      data: { name: name.trim(), full_name: name.trim() }
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Update users table directly to avoid role enum conflicts
    const { error: updateError } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onComplete()
  }

  return createPortal(
    <div className="z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh' }}>
      <div className="absolute inset-0" style={{ touchAction: 'none' }} />
      <div className="relative z-10 bg-white rounded-sm shadow-2xl p-6 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
        <p className="text-sm text-gray-600 mb-6">Please tell us your name to complete your profile.</p>
        
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
              className="w-full px-3 py-2 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] transition-shadow text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2.5 text-sm font-bold text-white bg-[#2874f0] hover:bg-[#1259cc] border border-[#2874f0] rounded-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
