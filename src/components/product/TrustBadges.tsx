import { ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react'

export default function TrustBadges() {
  const badges = [
    { icon: CreditCard, text: 'Secure Payments', description: 'Razorpay & UPI' },
    { icon: Truck, text: 'Fast Shipping', description: 'PAN India delivery' },
    { icon: RotateCcw, text: 'Easy Returns', description: '7-day policy' },
    { icon: ShieldCheck, text: 'Quality Guarantee', description: 'Factory direct' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-gray-100">
      {badges.map((badge, idx) => {
        const Icon = badge.icon
        return (
          <div key={idx} className="flex flex-col items-center justify-center text-center p-4 sm:p-3 rounded-2xl sm:rounded-xl bg-gray-50/50 sm:bg-gray-50 hover:bg-gray-100/50 transition-colors group">
            <Icon className="w-6 h-6 text-gray-700 mb-2.5 sm:mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <p className="text-[13px] sm:text-xs font-medium text-gray-900 mb-1 sm:mb-0.5">{badge.text}</p>
            <p className="text-[11px] sm:text-[10px] text-gray-500 leading-tight">{badge.description}</p>
          </div>
        )
      })}
    </div>
  )
}