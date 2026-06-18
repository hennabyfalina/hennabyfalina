// src/app/api/whatsapp/webhook/route.ts

import crypto from 'crypto';
import { NextResponse } from 'next/server';

// ─── PART 1: THE HANDSHAKE (GET) ─────────────────────────────────────────────
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

// ─── PART 2: RECEIVING MESSAGES (POST) ───────────────────────────────────────
export async function POST(request: Request) {
  try {
    // 🔒 WEBHOOK SPOOFING SHIELD
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!signature) {
      console.error('[Security] Blocked unsigned webhook attempt.');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const APP_SECRET = process.env.META_APP_SECRET;
    if (!APP_SECRET) {
      console.error('CRITICAL: META_APP_SECRET is missing from environment variables.');
      return new NextResponse('Server Error', { status: 500 });
    }

    const expectedSignature = `sha256=${crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')}`;
    const sigBuffer = Buffer.from(signature);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      console.error('[Security] Invalid Meta Webhook Signature Detected! Intrusion blocked.');
      return new NextResponse('Unauthorized', { status: 401 });
    }

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
              console.error(`[WhatsApp Delivery Failure]:`, JSON.stringify(statusObj.errors, null, 2));
            }
          }
          
          // --- THE AUTO-DEFLECTOR (FREE INBOUND USER REPLIES) ---
          if (change.value && change.value.messages && change.value.messages[0]) {
            const message = change.value.messages[0];
            const customerPhone = message.from; 
            const customerName = change.value.contacts?.[0]?.profile?.name || 'Customer';

            console.log(`[WhatsApp Inbound] Message received from ${customerName}`);
            
            const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
            const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;

            if (META_ACCESS_TOKEN && META_PHONE_NUMBER_ID) {
              autoReplies.push(
                fetch(`https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`, {
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
                      body: `Hi ${customerName}!\n\nThis is an automated notification channel.\n\nTo contact our administrative support team directly regarding your order status, please message our primary help line. Thank you!`
                    }
                  }),
                })
              );
            }
          }
        }
      }
      
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