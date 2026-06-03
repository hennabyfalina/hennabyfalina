// src/instrumentation-client.ts

import { initBotId } from 'botid/client/core';

// 🔒 Tell BotID which network paths require a real human browser session
initBotId({
  protect: [
    {
      // Protects your stock reservation engine
      path: '/api/checkout/reserve-stock',
      method: 'POST',
    },
    {
      // Protects your Razorpay initialization API
      path: '/api/razorpay',
      method: 'POST',
    },
    {
      // Protects any client-side Server Action invocations (Next.js action paths)
      path: '/*',
      method: 'POST',
    }
  ],
});