// src/app/api/whatsapp/webhook/route.ts

import crypto from 'crypto';
import { NextResponse } from 'next/server';

// ─── PART 1: The Handshake (GET) ─────────────────────────────────────────────
// Meta will ping this URL to verify you own the server
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Webhook verification failed.');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// ─── PART 2: Receiving Messages (POST) ───────────────────────────────────────
// Meta will send all customer messages and delivery receipts here
export async function POST(request: Request) {
  try {
    // 🔒 WEBHOOK SPOOFING SHIELD: Read raw text first to calculate the cryptographic hash
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!signature) {
      console.error('[Security] Blocked unsigned webhook attempt.');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // You MUST add META_APP_SECRET to your .env.local file (found in your Meta App Dashboard)
    const APP_SECRET = process.env.META_APP_SECRET;
    if (!APP_SECRET) {
      console.error('CRITICAL: META_APP_SECRET is missing from environment variables.');
      return new NextResponse('Server Error', { status: 500 });
    }

    // Calculate our own hash based on the raw payload
    const expectedSignature = `sha256=${crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')}`;

    const sigBuffer = Buffer.from(signature);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    // 🔒 TIMING-SAFE EQUAL: Compare signatures securely to prevent side-channel timing attacks
    // We MUST check lengths first to prevent timingSafeEqual from throwing an unhandled DoS exception
    if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      console.error('[Security] Invalid Meta Webhook Signature Detected! Intrusion blocked.');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // ✅ SIGNATURE VALIDATED: Safe to parse the JSON and process the business logic
    const body = JSON.parse(rawBody);

    const autoReplies: Promise<any>[] = [];

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          
          // --- LISTEN FOR DELIVERY STATUS REPORTS ---
          if (change.value && change.value.statuses && change.value.statuses[0]) {
            const statusObj = change.value.statuses[0];
            console.log(`[WhatsApp Status] Phone ${statusObj.recipient_id} is now: ${statusObj.status}`);
            
            if (statusObj.errors) {
              console.error(`[WhatsApp Delivery Failure Reason]:`, JSON.stringify(statusObj.errors, null, 2));
            }
          }
          
          // --- THE AUTO-DEFLECTOR (FREE INBOUND REPLIES) ---
          if (change.value && change.value.messages && change.value.messages[0]) {
            const message = change.value.messages[0];
            const customerPhone = message.from; 
            const customerName = change.value.contacts?.[0]?.profile?.name || 'Customer';

            console.log(`[WhatsApp Inbound] Message received from ${customerName}`);
            
            const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
            const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

            if (META_ACCESS_TOKEN && META_PHONE_NUMBER_ID) {
              // We reply with a standard 'text' type. This is 100% FREE in a user-initiated 24h window.
              autoReplies.push(fetch(`https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  recipient_type: 'individual',
                  to: customerPhone,
                  type: 'text',
                  text: {
                    preview_url: true,
                    // 🚨 CHANGE THE WA.ME LINK BELOW TO UNCLE ISMATH'S REAL NUMBER 🚨
                    body: `Hi! \n\nThis is the automated dispatch system for Henna By Falina.\n\nTo chat directly with our support team regarding your order or custom printing, please click the link below:\n\n https://wa.me/916383151922`
                  }
                }),
              }));
            }
          }
        }
      }
      
      // ⚡ OPTIMIZATION: Execute all auto-replies concurrently so we don't hold up Meta's webhook timeout
      if (autoReplies.length > 0) {
        await Promise.allSettled(autoReplies);
      }

      return NextResponse.json({ status: 'success' }, { status: 200 });
    }
    
    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    console.error('Webhook POST Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}