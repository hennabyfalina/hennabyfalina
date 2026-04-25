'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NameModal({ userId, email, onComplete }: { userId: string, email: string, onComplete: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <div className="bg-white rounded-sm shadow-2xl p-6 w-full max-w-md border border-gray-200">
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
            className="w-full py-2.5 text-sm font-normal text-gray-900 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
