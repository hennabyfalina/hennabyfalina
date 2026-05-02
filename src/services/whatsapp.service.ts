// src/services/whatsapp.service.ts

import { siteConfig } from '@/config/site';
import { formatCurrency } from '@/lib/utils';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_ADMIN_PHONE = process.env.META_ADMIN_PHONE;

// 🚨 CORE TEMPLATE SENDER ENGINE
export async function sendWhatsAppTemplate(
  to: string, 
  templateName: string, 
  bodyParams: any[], 
  buttonParam?: string // Used for the dynamic Amazon-style tracking link
) {
  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    console.error('[WhatsApp] Meta credentials missing');
    return false;
  }

  try {
    // 1. Map the text variables for the body
    const components: any[] = [
      {
        type: 'body',
        parameters: bodyParams.map(param => ({
          type: 'text',
          text: String(param).substring(0, 1024) // Meta strict limit protection
        }))
      }
    ];

    // 2. Map the dynamic URL variable for the button (if it exists)
    if (buttonParam) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: buttonParam
          }
        ]
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v17.0/${META_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: components
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`[WhatsApp] Template Error (${templateName}):`, data);
      return false;
    }

    console.log(`[WhatsApp] Successfully sent ${templateName} to ${to}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp] Network Error:', error);
    return false;
  }
}

// 🚨 ORDER DISPATCH ENGINE
export async function notifyOrderConfirmed(order: any) {
  let successCount = 0;
  
  const addressObj = order.addresses || order.shipping_address || {};
  const isPickup = order.shipping_method === 'pickup' || addressObj.delivery_method === 'pickup';

  // --- BUILD CLEAN ORDER SUMMARIES (NO NEWLINES ALLOWED BY META) ---
  const itemsArray = order.order_items || order.items || [];
  
  // Minimal summary for the Customer (Comma separated instead of newlines)
  const customerItems = itemsArray.map((item: any) => {
    const name = item.products?.name || item.name || 'Product';
    return `${item.quantity}x ${name}`;
  }).join(', '); // 🚨 FIXED: Used comma instead of \n

  // Detailed summary for Admin/Uncle (Pipes and semicolons instead of newlines)
  const adminItems = itemsArray.map((item: any) => {
    const name = item.products?.name || item.name || 'Product';
    const print = item.printing_type && item.printing_type !== 'None' ? ` | Print: ${item.printing_type}` : '';
    const files = item.artwork_urls?.length ? ` | Files: ${item.artwork_urls.length} Attached` : '';
    const note = item.printing_instructions ? ` | Note: ${item.printing_instructions}` : '';
    return `${item.quantity}x ${name}${print}${files}${note}`;
  }).join('; '); // 🚨 FIXED: Used semicolon instead of \n

  const delMethod = isPickup ? 'Store Pickup' : 'Home Delivery';
  const totalAmount = formatCurrency(order.total_amount);
  
  // Format Address cleanly for Admin (Commas instead of newlines)
  let adminAddress = 'Store Pickup';
  if (!isPickup) {
    adminAddress = `${addressObj.address_line1 || addressObj.address || ''}`;
    if (addressObj.city) adminAddress += `, ${addressObj.city} - ${addressObj.pincode}`; // 🚨 FIXED
    if (addressObj.landmark) adminAddress += `, Landmark: ${addressObj.landmark}`;       // 🚨 FIXED
    if (addressObj.delivery_instructions) adminAddress += `, Note: ${addressObj.delivery_instructions}`; // 🚨 FIXED
  }

  // --- 1. SEND TO CUSTOMER ---
  if (addressObj.phone) {
    let customerPhone = addressObj.phone.replace(/\D/g, '');
    if (customerPhone.length === 10) customerPhone = `91${customerPhone}`;
    
    const buttonUrlVariable = order.order_number;

    const sent = await sendWhatsAppTemplate(
      customerPhone, 
      'order_confirmed_receipt', // 🚨 FIXED: Matches your exact Meta dashboard name!
      [
        order.order_number, // {{1}}
        delMethod,          // {{2}}
        customerItems,      // {{3}}
        totalAmount         // {{4}}
      ],
      buttonUrlVariable
    );
    if (sent) successCount++;
  }

  // --- 2. SEND TO ADMIN (UNCLE ISMATH) ---
  if (META_ADMIN_PHONE) {
    let adminPhone = META_ADMIN_PHONE.replace(/\D/g, '');
    if (adminPhone.length === 10) adminPhone = `91${adminPhone}`;

    const sent = await sendWhatsAppTemplate(
      adminPhone, 
      'admin_order_alert', 
      [
        order.order_number,                               
        addressObj.name || order.customer_name || 'N/A',  
        addressObj.phone || 'N/A',                        
        adminAddress,                                     // 🚨 Now safe (no newlines)
        adminItems,                                       // 🚨 Now safe (no newlines)
        totalAmount                                       
      ]
    );
    if (sent) successCount++;
  }

  return successCount > 0;
}