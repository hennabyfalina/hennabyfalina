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
          text: String(param).substring(0, 1000) // Safely under 1024 to prevent splitting multi-byte characters
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
      `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`,
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

  // 🛡️ BULLETPROOF SANITIZER: Strip newlines/tabs which crash Meta, but keep Unicode (₹, Emojis, Local scripts)
  const sanitize = (str: any) => {
    if (!str) return 'N/A';
    const cleaned = String(str).replace(/[\r\n\t]+/g, ' ').trim();
    return cleaned === '' ? 'N/A' : cleaned.substring(0, 950);
  };

  // 📞 PHONE FORMATTER: Fixes multiple numbers, '0' prefixes, and formats for WhatsApp
  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    // Handle "0" prefix common in India (e.g. 09444233768)
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Handle standard 10-digit numbers by prepending India code
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    // WhatsApp requires a valid country code + number length (typically 11-15 digits)
    if (cleaned.length < 11 || cleaned.length > 15) {
      return null;
    }
    return cleaned;
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
    const customerPhone = formatWhatsAppNumber(addressObj.phone);
    if (customerPhone) {
      const buttonParam = order.order_number ? encodeURIComponent(String(order.order_number).trim()) : 'UNKNOWN';
      const sent = await sendWhatsAppTemplate(
        customerPhone, 
        'order_confirmed_receipt', 
        [
          sanitize(order.order_number), // {{1}}
          sanitize(delMethod),          // {{2}}
          sanitize(customerItemsRaw),   // {{3}}
          sanitize(totalAmount)         // {{4}}
        ],
        buttonParam // 🚨 SECURE URL PARAM 🚨
      );
      if (sent) successCount++;
    } else {
      console.warn(`[WhatsApp] Invalid customer phone number: ${addressObj.phone}`);
    }
  }

  // --- 2. SEND TO ADMIN (UNCLE ISMATH) ---
  if (META_ADMIN_PHONE) {
    // Split by comma to support multiple admin numbers in the .env file
    const adminPhones = META_ADMIN_PHONE.split(',').map(p => p.trim()).filter(Boolean);
    
    for (const phone of adminPhones) {
      const adminPhone = formatWhatsAppNumber(phone);
      if (adminPhone) {
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
      } else {
        console.warn(`[WhatsApp] Invalid admin phone number in env: ${phone}`);
      }
    }
  }

  return successCount > 0;
}