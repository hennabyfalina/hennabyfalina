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

  // 🛡️ BULLETPROOF SANITIZER: Meta crashes if it sees a newline (\n) or an empty string
  const sanitize = (str: any) => {
    if (!str) return 'N/A';
    const cleaned = String(str).replace(/\n/g, ', ').trim();
    return cleaned === '' ? 'N/A' : cleaned;
  };

  const itemsArray = order.order_items || order.items || [];
  
  const customerItemsRaw = itemsArray.map((item: any) => {
    const name = item.products?.name || item.name || 'Product';
    return `${item.quantity}x ${name}`;
  }).join(', '); 

  const adminItemsRaw = itemsArray.map((item: any) => {
    const name = item.products?.name || item.name || 'Product';
    const print = item.printing_type && item.printing_type !== 'None' ? ` | Print: ${item.printing_type}` : '';
    const files = item.artwork_urls?.length ? ` | Files: ${item.artwork_urls.length} Attached` : '';
    const note = item.printing_instructions ? ` | Note: ${item.printing_instructions}` : '';
    return `${item.quantity}x ${name}${print}${files}${note}`;
  }).join('; ');

  const delMethod = isPickup ? 'Store Pickup' : 'Home Delivery';
  const totalAmount = formatCurrency(order.total_amount);
  
  let adminAddressRaw = 'Store Pickup';
  if (!isPickup) {
    adminAddressRaw = `${addressObj.address_line1 || addressObj.address || ''}`;
    if (addressObj.city) adminAddressRaw += `, ${addressObj.city} - ${addressObj.pincode}`; 
    if (addressObj.landmark) adminAddressRaw += `, Landmark: ${addressObj.landmark}`;       
    if (addressObj.delivery_instructions) adminAddressRaw += `, Note: ${addressObj.delivery_instructions}`; 
  }

  // --- 1. SEND TO CUSTOMER ---
  if (addressObj.phone) {
    let customerPhone = addressObj.phone.replace(/\D/g, '');
    if (customerPhone.length === 10) customerPhone = `91${customerPhone}`;

    const sent = await sendWhatsAppTemplate(
      customerPhone, 
      'order_confirmed_receipt', 
      [
        sanitize(order.order_number), // {{1}}
        sanitize(delMethod),          // {{2}}
        sanitize(customerItemsRaw),   // {{3}}
        sanitize(totalAmount)         // {{4}}
      ],
      sanitize(order.order_number)    // Button URL param
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
        sanitize(order.order_number),                               
        sanitize(addressObj.name || order.customer_name),  
        sanitize(addressObj.phone),                        
        sanitize(adminAddressRaw),                                     
        sanitize(adminItemsRaw),                                       
        sanitize(totalAmount)                                       
      ]
    );
    if (sent) successCount++;
  }

  return successCount > 0;
}