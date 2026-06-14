// src/components/profile/PasskeyManager.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Key, Trash2, Plus, Loader2 } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

export default function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  
  const loadPasskeys = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.passkey.list()
      if (data) {
        setPasskeys(data)
      } else if (error) {
        console.error('Passkeys load error:', error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPasskeys()
  }, [])

  const handleRegister = async () => {
    setRegistering(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.registerPasskey()

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('cancelled') || msg.includes('user cancelled')) {
          showToast('Passkey registration cancelled', 'error')
        } else {
          showToast(`Registration failed: ${error.message}`, 'error')
        }
      } else if (data) {
        showToast('Passkey securely registered!', 'success')
        loadPasskeys()
      }
    } catch (err: any) {
       showToast(`Error: ${err.message}`, 'error')
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async (passkeyId: string) => {
    if (!confirm('Are you sure you want to remove this passkey?')) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.passkey.delete({ passkeyId })
      if (error) {
        showToast(`Failed to delete passkey: ${error.message}`, 'error')
      } else {
        showToast('Passkey removed successfully', 'success')
        setPasskeys(p => p.filter(pk => pk.id !== passkeyId))
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-[14px] text-gray-500 leading-relaxed">
        Passkeys let you sign in securely with your fingerprint, face, or screen lock instead of a password.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[14px]">Loading registered passkeys...</span>
        </div>
      ) : passkeys.length > 0 ? (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {passkeys.map(pk => (
            <li key={pk.id} className="flex items-center justify-between p-4 bg-stone-50/30">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-white rounded-full border border-gray-200 shadow-sm flex-shrink-0">
                  <Key className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">
                    {pk.friendly_name || 'Passkey Device'}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Added: {new Date(pk.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(pk.id)}
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                title="Remove passkey"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-[14px] text-gray-500 italic bg-stone-50 p-4 rounded-xl border border-gray-100 text-center">
          No passkeys registered to this account yet.
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={registering || loading}
        className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-gray-900 text-white rounded-full text-[14px] font-bold tracking-wide hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
      >
        {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
        <span>Register New Passkey</span>
      </button>
    </div>
  )
}
