// src/app/(auth)/login/page.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle, Key } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { siteConfig } from '@/config/site'
import GoogleOneTap from '@/components/auth/GoogleOneTap'
import Image from 'next/image'

const carouselImages = [
  { src: '/hero-henna-cone.jpg', alt: 'Henna Cone Application', caption: 'Bridal quality henna' },
  { src: '/hero-oil-bottle.jpg', alt: 'Aftercare Oils', caption: '100% natural oils' },
  { src: '/hero-stencil.jpg', alt: 'Design Stencils', caption: 'Precision stencils' },
  { src: '/hero-mehendi.jpg', alt: 'Finished Mehendi', caption: 'Deep rich stain' },
]

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [authMode, setAuthMode] = useState<'otp_send' | 'otp_verify'>('otp_send')
  const [otpCode, setOtpCode] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [lastUsedMethod, setLastUsedMethod] = useState<'google' | 'email' | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [carouselIndex, setCarouselIndex] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const turnstileRef = useRef<TurnstileInstance>(null)

  const handlePasskeyLogin = async () => {
    localStorage.setItem('last_login_method', 'passkey')
    setIsPasskeyLoading(true)
    setError('')
    setSuccessMessage('')

    if (!captchaToken) {
      setError('Please complete the security check to continue.')
      setIsPasskeyLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPasskey({
        options: { captchaToken }
      })

      if (error) {
        setTurnstileKey(Date.now())
        setCaptchaToken('')
        const errorCode = (error as any).code || ''
        const errorMsg = error.message.toLowerCase()

        if (errorCode === 'passkey_disabled' || errorMsg.includes('not enabled')) {
          setError('Passkeys are currently disabled for this application.')
        } else if (errorCode === 'webauthn_credential_not_found' || errorMsg.includes('credential not found') || errorMsg.includes('not registered')) {
          setError('No passkey found on this device. Please sign in with your email first to register one.')
        } else if (errorCode === 'webauthn_verification_failed' || errorMsg.includes('verification failed')) {
          setError('Passkey verification failed. Please try again.')
        } else if (errorMsg.includes('cancelled') || errorMsg.includes('user cancelled') || errorMsg.includes('not allowed')) {
          setError('Passkey sign-in was cancelled.')
        } else {
          setError(error.message || 'An error occurred during passkey sign-in.')
        }
        setIsPasskeyLoading(false)
      } else if (data) {
        const params = new URLSearchParams(window.location.search)
        let redirectPath = params.get('next') || params.get('redirect') || '/products'
        if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
          redirectPath = '/products'
        }
        router.push(redirectPath)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during passkey sign-in')
      setIsPasskeyLoading(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setTurnstileKey(Date.now())
    const storedMethod = localStorage.getItem('last_login_method') as 'google' | 'email' | null
    if (storedMethod) setLastUsedMethod(storedMethod)
  }, [])

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

  useEffect(() => {
    try {
      const storedEmail = sessionStorage.getItem('login_email')
      const storedMode = sessionStorage.getItem('login_authMode') as 'otp_send' | 'otp_verify' | null
      const storedTimer = sessionStorage.getItem('login_resendTimer')
      const storedTimestamp = sessionStorage.getItem('login_timestamp')

      if (storedEmail) setEmail(storedEmail)
      if (storedMode) setAuthMode(storedMode)

      if (storedTimer && storedTimestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp)) / 1000)
        const remaining = parseInt(storedTimer) - elapsed
        if (remaining > 0) {
          setResendTimer(remaining)
          setIsOtpSent(true)
        } else {
          setIsOtpSent(false)
        }
      }
    } catch (err) {}
  }, [])

  useEffect(() => {
    try {
      if (email) sessionStorage.setItem('login_email', email)
      sessionStorage.setItem('login_authMode', authMode)
    } catch (err) {}
  }, [email, authMode])

  useEffect(() => {
    const checkAndResetOAuthState = (force = false) => {
      const oauthStart = sessionStorage.getItem('oauth_start_time')
      if (oauthStart) {
        const timePassed = Date.now() - parseInt(oauthStart)
        if (force || timePassed > 3000) {
          sessionStorage.removeItem('oauth_start_time')
          window.location.reload()
        }
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkAndResetOAuthState()
    }
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkAndResetOAuthState(true)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', handlePageShow)
    const interval = setInterval(() => checkAndResetOAuthState(false), 500)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', handlePageShow)
      clearInterval(interval)
    }
  }, [])

  const handleGoogleLogin = async () => {
    localStorage.setItem('last_login_method', 'google')
    setIsGoogleLoading(true)
    sessionStorage.setItem('oauth_start_time', Date.now().toString())
    const params = new URLSearchParams(window.location.search)
    let redirectPath = params.get('next') || params.get('redirect') || '/products'
    if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
      redirectPath = '/products'
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    })
    if (error) {
      sessionStorage.removeItem('oauth_start_time')
      setError(error.message)
      setIsGoogleLoading(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      try {
        sessionStorage.setItem('login_resendTimer', resendTimer.toString())
        sessionStorage.setItem('login_timestamp', Date.now().toString())
        setIsOtpSent(true)
      } catch (e) {}
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000)
    } else if (resendTimer === 0 && isOtpSent) {
      try {
        sessionStorage.removeItem('login_resendTimer')
        sessionStorage.removeItem('login_timestamp')
      } catch (e) {}
    }
    return () => clearInterval(interval)
  }, [resendTimer, isOtpSent])

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
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many')) {
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

  const handleClearOtp = () => {
    setOtpCode('')
    setError('')
    setSuccessMessage('')
    inputRefs.current[0]?.focus()
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
        setError('Your verification code has expired. Please click "Resend Code" to get a new one.')
      } else if (errorMsg.includes('invalid') || errorMsg.includes('mismatch')) {
        setError('The verification code is incorrect. Please check and try again.')
      } else {
        setError(error.message)
      }
      return
    }
    localStorage.setItem('last_login_method', 'email')
    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', data.user.id)
        .maybeSingle()
      if (userData?.role === 'admin') {
        router.push('/admin-gate')
        router.refresh()
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
    let redirectPath = params.get('next') || params.get('redirect') || '/products'
    if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
      redirectPath = '/products'
    }
    router.push(redirectPath)
  }

  useEffect(() => {
    if (authMode === 'otp_verify' && otpCode.length === 6 && !loading) {
      handleVerifyOtp()
    }
  }, [otpCode, authMode])

  const getMaskedEmail = (email: string): string => {
    if (!email || !email.includes('@')) return email
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) return `${localPart[0]}***@${domain}`
    return `${localPart.substring(0, 2)}***${localPart.substring(localPart.length - 1)}@${domain}`
  }

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '')
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

  const isActionLocked = isGoogleLoading || isPasskeyLoading || loading
  const currentSubmitHandler = authMode === 'otp_send' ? handleSendOtp : handleVerifyOtp

  return (
    <>
      <GoogleOneTap />
      <div className="min-h-screen bg-white flex flex-col md:flex-row antialiased select-none font-sans">
        
        {/* 🚀 LEFT: IMMERSIVE 70% MEDIA CANVAS (Apple Architecture Layout) */}
        <div className="hidden md:block md:w-[68%] lg:w-[70%] relative bg-stone-50 min-h-screen overflow-hidden">
          <div className="absolute inset-0">
            {carouselImages.map((img, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  idx === carouselIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  priority={idx === 0}
                  sizes="70vw"
                />
              </div>
            ))}
            
            {/* Weightless Editorial Branding Text Overlays */}
            <div className="absolute inset-0 bg-black/15 flex flex-col justify-between p-10 z-10">
              <Link href="/" className="flex items-center gap-3 text-3xl font-light tracking-tight text-white drop-shadow-xs w-fit outline-none">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                />
                Henna By Falina
              </Link>
              <div className="text-white space-y-1">
                <p className="text-[11px] uppercase tracking-widest font-bold text-white/80">#PureHenna Studio</p>
                <p className="text-base font-light max-w-xs capitalize tracking-tight text-white/90">
                  {carouselImages[carouselIndex].caption.toLowerCase()}
                </p>
              </div>
            </div>
            
            {/* Minimalist Micro Dots Indicators */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 z-10">
              {carouselImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`w-1 h-1 rounded-full transition-all duration-300 outline-none ${
                    idx === carouselIndex ? 'bg-white w-3.5' : 'bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 🚀 RIGHT: STREAMLINED 30% LOGIN WORKSPACE (High Conversion Engine) */}
        <div className="w-full md:w-[32%] lg:w-[30%] shrink-0 bg-white flex items-center justify-center px-6 sm:px-8 py-10 overflow-y-auto">
          <div className="w-full max-w-[320px] mx-auto space-y-6">
            
            {/* Mobile Title View Wrapper */}
            <div className="md:hidden flex flex-col items-center gap-3 text-center mb-8">
              <Link href="/" className="flex flex-row items-center gap-3 text-2xl font-normal tracking-tight text-gray-950 outline-none">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={48}
                  height={48}
                />
                {siteConfig.name}
              </Link>
            </div>

            {/* Left-Aligned Clean Heading Descriptor Block */}
            <div className="text-left space-y-1">
              <h1 className="text-2xl font-normal text-gray-950 tracking-tight">Sign In</h1>
              <p className="text-[13px] text-gray-400 font-medium">Access your studio account workspace profile</p>
            </div>

            {/* Error / Success Toast Callout Streams */}
            {error && (
              <div className="flex items-start gap-2 text-[13px] text-red-600 bg-red-50/60 border border-red-100/50 p-2.5 rounded-xl text-left animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
                <span className="font-medium">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-start gap-2 text-[13px] text-emerald-700 bg-emerald-50/60 border border-emerald-100/50 p-2.5 rounded-xl text-left animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Google OAuth & Passkey Gateway Integrations */}
            {authMode === 'otp_send' && (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isActionLocked}
                  className="w-full h-11 flex items-center justify-center gap-2 border border-stone-200 hover:border-gray-950 bg-white rounded-full text-gray-900 text-[13px] font-semibold transition-all disabled:opacity-40 cursor-pointer outline-none active:scale-[0.99]"
                >
                  {isGoogleLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isActionLocked}
                  className="w-full h-11 flex items-center justify-center gap-2 border border-stone-200 hover:border-gray-950 bg-white rounded-full text-gray-900 text-[13px] font-semibold transition-all disabled:opacity-40 cursor-pointer outline-none active:scale-[0.99]"
                >
                  {isPasskeyLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-gray-900 shrink-0" strokeWidth={2.2} />
                      <span>Sign in with Passkey</span>
                    </>
                  )}
                </button>
                
                <div className="relative my-4 pt-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-100"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-[12px] font-medium text-gray-400 uppercase tracking-wider">or</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={currentSubmitHandler} className="space-y-4 text-left">
              {authMode === 'otp_send' && (
                <div className="space-y-1.5">
                  <label htmlFor="login-email-address" className="block text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    id="login-email-address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isActionLocked}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full px-0 py-2 border-b border-stone-300 focus:border-gray-950 outline-none transition-colors text-[14px] text-gray-900 bg-transparent disabled:opacity-50 placeholder:text-gray-300"
                  />
                </div>
              )}

              {authMode === 'otp_send' && resendTimer > 0 && (
                <div className="space-y-2 animate-fade-in">
                  <p className="text-[12px] text-amber-700 bg-amber-50/60 border border-amber-100/50 p-2 rounded-xl font-medium leading-normal">
                    Please wait {resendTimer}s before requesting another verification secure token code.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuthMode('otp_verify')}
                    className="text-[12px] text-gray-950 font-bold hover:underline w-fit cursor-pointer transition-colors outline-none"
                  >
                    Already have a token code for this email?
                  </button>
                </div>
              )}

              {authMode === 'otp_verify' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                      Verification Code
                    </label>
                    <p className="text-[13px] text-gray-400 font-medium leading-normal">
                      We sent a code to <span className="font-semibold text-gray-950">{getMaskedEmail(email)}</span>
                    </p>
                    
                    {/* Compact Micro OTP Digits Container Box */}
                    <div className="flex gap-1.5 justify-between pt-2">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => { inputRefs.current[idx] = el }}
                          type="text"
                          inputMode="numeric"
                          aria-label={`Digit ${idx + 1} of verification code`}
                          placeholder="0"
                          maxLength={1}
                          value={otpCode[idx] || ''}
                          disabled={isActionLocked}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-10 h-10 sm:w-11 h-11 text-center text-base sm:text-lg font-semibold text-gray-950 border-b-2 border-stone-200 focus:border-gray-950 outline-none bg-transparent"
                        />
                      ))}
                    </div>
                    {otpCode.length > 0 && (
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={handleClearOtp}
                          className="text-[11px] font-bold text-gray-400 hover:text-gray-950 tracking-wider uppercase transition-colors cursor-pointer outline-none"
                        >
                          clear code
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-3.5 pt-1">
                    <p className="text-[13px] text-gray-400 font-medium">
                      Didn&apos;t receive the code?{' '}
                      {resendTimer > 0 ? (
                        <span className="text-gray-400 font-semibold">Wait {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={!captchaToken || isActionLocked}
                          className="text-gray-950 font-bold hover:underline transition-colors disabled:opacity-40 cursor-pointer outline-none"
                        >
                          Resend code
                        </button>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('otp_send')
                        setCaptchaToken('')
                        setError('')
                        setSuccessMessage('')
                        setTurnstileKey(Date.now())
                      }}
                      className="text-[12px] text-gray-400 font-semibold hover:text-gray-950 transition-colors cursor-pointer outline-none"
                    >
                      Use a different email address
                    </button>
                  </div>
                </div>
              )}

              {/* Cloudflare Turnstile Verification Space */}
              {(authMode === 'otp_send' || !isOtpSent) && (
                <div className="flex justify-center pt-1 w-full overflow-hidden">
                  <Turnstile
                    key={turnstileKey}
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                    options={{ theme: 'light', refreshExpired: 'auto', size: 'flexible' }}
                    className="w-full scale-[0.98] origin-center"
                    onSuccess={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken('')}
                    onError={() => setCaptchaToken('')}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isActionLocked ||
                  (authMode === 'otp_send' && (!email.trim() || !captchaToken || resendTimer > 0)) ||
                  (authMode === 'otp_verify' && otpCode.length !== 6)
                }
                className="w-full h-11 bg-black hover:bg-stone-900 text-white rounded-full text-[13px] font-semibold transition-all disabled:opacity-40 cursor-pointer outline-none active:scale-[0.99] capitalize"
              >
                {loading ? (
                  authMode === 'otp_send' ? 'Sending code...' : 'Verifying...'
                ) : authMode === 'otp_send' ? (
                  resendTimer > 0 ? `Wait ${resendTimer}s` : 'Continue'
                ) : (
                  'Verify secure code'
                )}
              </button>
            </form>

            {/* Legal Footnote Strings */}
            <p className="text-center text-[12px] text-gray-400 font-medium pt-2">
              By continuing, you agree to our{' '}
              <Link href="/terms-conditions" className="text-gray-500 hover:text-gray-950 font-semibold outline-none">Terms</Link> and{' '}
              <Link href="/privacy-policy" className="text-gray-500 hover:text-gray-950 font-semibold outline-none">Privacy</Link>.
            </p>
          </div>
        </div>

      </div>
    </>
  )
}