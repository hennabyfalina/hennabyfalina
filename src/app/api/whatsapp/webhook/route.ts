// src/app/api/whatsapp/webhook/route.ts

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
    // Meta requires us to return ONLY the challenge string to prove we are real
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
    const body = await request.json();

    // Verify this is an actual WhatsApp event
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          
          // --- NEW: LISTEN FOR DELIVERY STATUS REPORTS ---
          if (change.value && change.value.statuses && change.value.statuses[0]) {
            const statusObj = change.value.statuses[0];
            console.log(`[WhatsApp Status] Phone ${statusObj.recipient_id} is now: ${statusObj.status}`);
            
            if (statusObj.errors) {
              console.error(`[WhatsApp Delivery Failure Reason]:`, JSON.stringify(statusObj.errors, null, 2));
            }
          }

          
          // Check if it's an incoming message from a customer
          if (change.value && change.value.messages && change.value.messages[0]) {
            const message = change.value.messages[0];
            const customerPhone = message.from; 
            const messageText = message.text?.body; 
            const customerName = change.value.contacts?.[0]?.profile?.name || 'Unknown';

            console.log(`New WhatsApp Message!`);
            console.log(`From: ${customerName} (${customerPhone})`);
            console.log(`Message: ${messageText}`);
            
            // Next Step: We will write the code to save this to Supabase here!
          }
        }
      }
      // You must always return a 200 OK to Meta, or they will keep resending the message
      return NextResponse.json({ status: 'success' }, { status: 200 });
    }
    
    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    console.error('Webhook POST Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}