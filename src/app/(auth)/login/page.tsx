// src/app/(auth)/login/page.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { siteConfig } from '@/config/site'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [authMode, setAuthMode] = useState<'otp_send' | 'otp_verify'>('otp_send')
  const [otpCode, setOtpCode] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [showWhatsappSoon, setShowWhatsappSoon] = useState(false)
  
  // Turnstile State
  const [turnstileKey, setTurnstileKey] = useState(Date.now())
  const [captchaToken, setCaptchaToken] = useState<string>('')
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const turnstileRef = useRef<TurnstileInstance>(null)

  // ─── Auto-clear Messages ────────────────────────────────────────────────
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // ─── Restore State from Session Storage ──────────────────────────────────
  useEffect(() => {
    try {
      const storedEmail = sessionStorage.getItem('login_email')
      const storedMode = sessionStorage.getItem('login_authMode') as 'otp_send' | 'otp_verify' | null
      const storedTimer = sessionStorage.getItem('login_resendTimer')
      const storedTimestamp = sessionStorage.getItem('login_timestamp')

      if (storedEmail) setEmail(storedEmail)
      if (storedMode) setAuthMode(storedMode)

      // Calculate timer strictly on mount
      if (storedTimer && storedTimestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp)) / 1000)
        const remaining = parseInt(storedTimer) - elapsed
        if (remaining > 0) {
          setResendTimer(remaining)
          setIsOtpSent(true) // Decoupled OTP state
        } else {
          setIsOtpSent(false)
        }
      }
    } catch (err) {
      console.warn('Session storage access failed', err)
    }
  }, [])

  // ─── Persist State Changes ────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (email) sessionStorage.setItem('login_email', email)
      sessionStorage.setItem('login_authMode', authMode)
    } catch (err) {}
  }, [email, authMode])

  // ─── Enterprise Watchdog: BFCache "Nuclear Reload" ──────────────────────
  useEffect(() => {
    const checkAndResetOAuthState = (force = false) => {
      const oauthStart = sessionStorage.getItem('oauth_start_time')
      if (oauthStart) {
        const timePassed = Date.now() - parseInt(oauthStart)
        // Only trigger the nuclear reload if forced (via pageshow) OR if 3 seconds have passed
        if (force || timePassed > 3000) {
          console.warn('Aborted OAuth flow detected. Executing BFCache purge (Hard Reload)...')
          sessionStorage.removeItem('oauth_start_time')
          window.location.reload() // Busts the frozen DOM state
        }
      }
    }

    // Highly reliable on mobile Safari tab switching
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkAndResetOAuthState()
    }
    
    // Catches standard browser back button (force = true because they definitely came back)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkAndResetOAuthState(true)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', handlePageShow)

    // The Ultimate Failsafe: Background interval (waits 3 seconds before acting)
    const interval = setInterval(() => checkAndResetOAuthState(false), 500)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', handlePageShow)
      clearInterval(interval)
    }
  }, [])

  // ─── Google Login ───────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    
    // Drop a timestamp breadcrumb so the Watchdog knows to wait 3 seconds
    sessionStorage.setItem('oauth_start_time', Date.now().toString())
    
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('redirect') || '/products'

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    
    if (error) {
      sessionStorage.removeItem('oauth_start_time')
      setError(error.message)
      setIsGoogleLoading(false)
    }
  }

  // ─── Resend Timer Engine ──────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
        try {
          sessionStorage.setItem('login_resendTimer', resendTimer.toString())
          sessionStorage.setItem('login_timestamp', Date.now().toString())
          setIsOtpSent(true) 
        } catch (e) {}
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    } else if (resendTimer === 0 && isOtpSent) {
        try {
          sessionStorage.removeItem('login_resendTimer')
          sessionStorage.removeItem('login_timestamp')
        } catch (e) {}
    }
    return () => clearInterval(interval)
  }, [resendTimer, isOtpSent])

  // ─── OTP Login ────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!captchaToken) {
      setError('Please complete the security check to continue.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { captchaToken }
    })
    setLoading(false)

    if (error) {
      setTurnstileKey(Date.now()) 
      setCaptchaToken('')

      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        setError('Too many requests. Please wait a minute before trying again.')
        setResendTimer(60) 
      } else {
        setError(error.message)
      }
    } else {
      setSuccessMessage('A verification code has been sent to your email.')
      setAuthMode('otp_verify')
      setResendTimer(60) 
      setIsOtpSent(true)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setError('')
    setSuccessMessage('')

    if (!captchaToken) {
      setError('Please complete the security check to resend the code.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { captchaToken }
    })
    setLoading(false)

    if (error) {
      setTurnstileKey(Date.now()) 
      setCaptchaToken('')

      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        setError('Too many requests. Please wait a minute before trying again.')
        setResendTimer(60)
      } else {
        setError(error.message)
      }
    } else {
      setSuccessMessage('A new verification code has been sent to your email.')
      setResendTimer(60)
      setCaptchaToken('')
    }
  }

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email'
    })

    if (error) {
      setLoading(false)
      const errorMsg = error.message.toLowerCase()
      if (errorMsg.includes('token has expired or is invalid')) {
        setError('The verification code is incorrect or has expired. Please try again or request a new code.')
      } else if (errorMsg.includes('expired')) {
        setError('Your verification code has expired. Please click "Resend code" to get a new one.')
      } else if (errorMsg.includes('invalid') || errorMsg.includes('mismatch')) {
        setError('The verification code is incorrect. Please check and try again.')
      } else {
        setError(error.message)
      }
      return
    }

    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (userData?.role === 'admin') {
        window.location.href = '/admin-gate'
        return
      }
    }

    try {
        sessionStorage.removeItem('login_email')
        sessionStorage.removeItem('login_authMode')
        sessionStorage.removeItem('login_resendTimer')
        sessionStorage.removeItem('login_timestamp')
        sessionStorage.removeItem('oauth_start_time')
      } catch (e) {}

    setLoading(false)
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('redirect') || '/products'
    router.push(redirectPath)
  }

  // ─── Auto-Submit OTP ──────────────────────────────────────────────────────
  useEffect(() => {
    if (authMode === 'otp_verify' && otpCode.length === 6 && !loading) {
      handleVerifyOtp()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode, authMode])

  function getMaskedEmail(email: string): string {
    if (!email || !email.includes('@')) return email
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) return `${localPart[0]}***@${domain}`
    return `${localPart.substring(0, 2)}***${localPart.substring(localPart.length - 1)}@${domain}`
  }

  const handleOtpChange = (index: number, value: string) => {
    let digits = value.replace(/\D/g, '')
    if (digits.length === 6) {
      setOtpCode(digits)
      inputRefs.current[5]?.focus()
      return
    }
    const newDigit = digits.slice(-1)
    const otpArray = otpCode.split('')
    while (otpArray.length < 6) otpArray.push('')
    otpArray[index] = newDigit
    const newOtp = otpArray.join('')
    setOtpCode(newOtp)

    if (newDigit !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      setOtpCode(pastedData)
      const focusIndex = Math.min(pastedData.length, 5)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  const isActionLocked = isGoogleLoading || loading

  const currentSubmitHandler = authMode === 'otp_send' ? handleSendOtp : handleVerifyOtp

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="w-full py-4 flex items-center justify-center border-b border-gray-100">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 hover:opacity-90 transition-opacity">
          {siteConfig.name}
        </Link>
      </header>

      <div className="flex-1 flex flex-col pt-8 pb-12 px-4 w-full max-w-[380px] mx-auto">
        
        {error && (
          <div className="mb-4 p-4 border-l-4 border-red-600 border border-gray-300 rounded-sm bg-white shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-red-700 font-bold text-sm mb-1">There was a problem</h3>
                <p className="text-sm text-gray-900">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 border border-green-600 rounded-sm bg-green-50 shadow-sm">
            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <div className="border border-gray-300 rounded-sm p-6 bg-white shadow-sm">
          <h1 className="text-3xl font-normal text-gray-900 mb-4 tracking-tight">Sign in</h1>

          {/* Progressive Disclosure: Only show alternative login methods on the first step */}
          {authMode === 'otp_send' && (
            <>
              <div className="space-y-3 mb-6">
                {showWhatsappSoon && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm text-sm text-blue-800 flex items-start gap-2 shadow-sm">
                    <div className="font-bold text-blue-600 mt-0.5 bg-blue-200 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0">i</div>
                    <p>WhatsApp login is coming soon! Please use Email OTP or Google for now.</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowWhatsappSoon(true)}
                  disabled={isActionLocked}
                  className="w-full flex justify-center py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <div className="flex items-center justify-start w-52 gap-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-[#25D366]" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.452-.885-.77-1.482-1.721-1.656-2.02-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.029 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    <span className="text-[15px] whitespace-nowrap">Continue with WhatsApp</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isActionLocked}
                  className="w-full flex justify-center py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span className="text-[15px]">Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-start w-48 gap-3">
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-[15px]">Continue with Google</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or use email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={currentSubmitHandler} className="space-y-4">
          
          {/* Email Form */}
          {authMode === 'otp_send' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-900">Enter your email address</label>
                {isOtpSent && (
                  <button 
                    type="button" 
                    disabled={isActionLocked}
                    onClick={() => { setAuthMode('otp_verify'); setError(''); setSuccessMessage(''); }} 
                    className="text-xs font-medium text-[#007185] hover:text-[#C7511F] hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    Return to OTP
                  </button>
                )}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isActionLocked}
                autoComplete="email"
                placeholder="Email"
                title="Email"
                className="w-full px-3 py-2 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] transition-shadow text-sm disabled:bg-gray-50 disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* OTP Verify Form */}
          {authMode === 'otp_verify' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-900">Verification Code</label>
                
                {/* ESCAPE HATCH */}
                <button 
                  type="button" 
                  disabled={isActionLocked}
                  onClick={() => { 
                    setAuthMode('otp_send'); 
                    setCaptchaToken(''); 
                    setError(''); 
                    setSuccessMessage('');
                    setTurnstileKey(Date.now()); // Force fresh Turnstile
                  }} 
                  className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  <span aria-hidden="true">&larr;</span> All sign-in options
                </button>
              </div>
              <div className="p-3 bg-[#F0F8FF] border border-[#007185] rounded-sm mb-4 mt-2">
                <p className="text-sm text-[#007185] leading-relaxed">
                  An OTP has been sent to <span className="font-bold text-gray-900">{getMaskedEmail(email)}</span>.<br/>
                  This code is valid for 10 minutes.
                </p>
              </div>
              
              <div className="flex justify-between gap-1 sm:gap-2 mb-4 mt-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={6}
                    value={otpCode[index] || ''}
                    disabled={isActionLocked}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    autoComplete="one-time-code"
                    title={`OTP Digit ${index + 1}`}
                    placeholder=""
                    className="w-9 sm:w-11 h-10 sm:h-12 text-center text-lg sm:text-xl font-bold text-gray-900 bg-white border border-gray-400 rounded-sm focus:outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] transition-shadow disabled:bg-gray-50 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                ))}
              </div>

              {/* Resend Option with Dynamic Turnstile */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-600 mb-2">
                  Didn't receive the code?{' '}
                  {resendTimer > 0 && (
                    <span className="text-gray-400 font-medium">Resend in {resendTimer}s</span>
                  )}
                </p>

                {resendTimer === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 mt-2 w-full overflow-hidden">
                    <Turnstile
                      key={`resend-${turnstileKey}`}
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                      options={{
                        theme: 'light',
                        refreshExpired: 'auto',
                        size: 'flexible',
                      }}
                      className="w-full"
                      style={{ width: '100%' }}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken('')}
                      onError={() => setCaptchaToken('')}
                    />
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={!captchaToken || isActionLocked}
                      className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Resend code'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Turnstile Security Check (Initial Login) */}
          {authMode === 'otp_send' && resendTimer === 0 && (
            <div className="flex justify-center py-2 w-full overflow-hidden">
              <Turnstile
                key={turnstileKey}
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                options={{
                  theme: 'light',
                  refreshExpired: 'auto',
                  size: 'flexible',
                }}
                className="w-full"
                style={{ width: '100%' }}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
                onError={() => setCaptchaToken('')}
              />
            </div>
          )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isActionLocked || 
                (authMode === 'otp_send' && (resendTimer > 0 || !email.trim() || !captchaToken)) ||
                (authMode === 'otp_verify' && otpCode.length !== 6)
              }
              className="w-full py-2.5 mt-2 text-sm font-normal text-gray-900 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loading
              ? (authMode === 'otp_send' ? 'Sending code...' : 'Verifying...')
              : (authMode === 'otp_send' ? (resendTimer > 0 ? `Wait ${resendTimer}s to send again` : 'Send OTP Code') : 'Verify Code')
            }
            </button>
          </form>

          <p className="text-xs text-gray-900 leading-relaxed mt-4">
            By continuing, you agree to {siteConfig.name}'s{' '}
            <Link href="/terms" className="text-[#007185] hover:text-[#C7511F] hover:underline">
              Conditions of Use
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#007185] hover:text-[#C7511F] hover:underline">
              Privacy Notice
            </Link>.
          </p>

        </div>
      </div>

      <footer className="w-full bg-gray-50 py-8 border-t border-gray-200 mt-auto">
        <div className="flex justify-center items-center gap-6 mb-4 flex-wrap px-4">
          <Link href="/terms" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Conditions of Use</Link>
          <Link href="/privacy" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Privacy Notice</Link>
          <Link href="/support" className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline">Help</Link>
        </div>
        <p className="text-xs text-gray-500 text-center">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}