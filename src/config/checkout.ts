// src/config/checkout.ts

export const checkoutConfig = {
  steps: {
    delivery: {
      title: 'Delivery Method',
      number: 1,
    },
    address: {
      shippingTitle: 'Shipping Address',
      pickupTitle: 'Pickup Details',
      number: 2,
    },
    payment: {
      title: 'Payment Method',
      number: 3,
      description: 'You will securely enter payment details in the next step via Razorpay.',
    },
  },
  security: {
    title: 'Secure Checkout',
    modal: {
      description: 'We secure your payment and personal information when you share or save it with us.',
      points: [
        "We don't share payment details with third-party sellers.",
        "We don't sell your information to others."
      ],
      footer: 'Encrypted via Industry-Standard SSL/TLS',
    }
  },
  errors: {
    general: 'An unexpected error occurred during checkout. Please try again.',
    addressMissing: 'Please select or add a delivery address.',
    addressIncomplete: 'Please fill in all required address fields.',
    phoneInvalid: 'Please enter a valid 10-digit phone number.',
    pinInvalid: 'Please enter a valid 6-digit PIN code.',
  }
} as const