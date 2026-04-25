'use client'

import { useRouter } from 'next/navigation'
import PaymentButton from '@/components/checkout/PaymentButton'
import { showToast } from '@/components/ui/Toast'

interface RetryPaymentButtonProps {
  orderId: string
  orderNumber: string
  amount: number
}

export default function RetryPaymentButton({ orderId, orderNumber, amount }: RetryPaymentButtonProps) {
  const router = useRouter()

  return (
    <PaymentButton
      onInitiate={async () => ({ orderId, orderNumber, amount })}
      onSuccess={(id) => {
        showToast('Payment successful!')
        if (id) {
          router.push(`/order/${id}`)
        } else {
          router.push(`/profile/orders`)
        }
      }}
      onFailure={(msg) => {
        showToast(msg || 'Payment failed. Please try again.')
        router.refresh()
      }}
      amount={amount}
      buttonText="Complete Payment"
      className="px-4 py-2 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-xl text-sm font-medium text-gray-900 shadow-sm transition-colors text-center w-full focus:ring-2 focus:ring-[#007185] focus:outline-none flex items-center justify-center gap-2"
    />
  )
}