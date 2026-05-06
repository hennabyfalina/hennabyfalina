// src/services/whatsapp.service.ts

import { siteConfig } from '@/config/site';
import { formatCurrency } from '@/lib/utils';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_ADMIN_PHONE = process.env.META_ADMIN_PHONE;

// 🛡️ RUTHLESS SANITIZER FOR META API
// Meta STRICTLY forbids \n, \r, \t and >= 4 consecutive spaces inside template parameters.
const sanitizeForMeta = (value: any): string => {
  if (!value) return 'N/A';
  let str = String(value);
  
  // Replace ALL newlines, carriage returns, and tabs with a single space
  str = str.replace(/[\n\r\t]+/g, ' ');
  
  // Collapse any run of 4 or more spaces into exactly 3 spaces
  str = str.replace(/ {4,}/g, '   ');
  
  // Trim leading/trailing whitespace
  return str.trim();
}

/**
 * Formats order items into a clean, SINGLE-LINE string for WhatsApp Meta Templates.
 * Uses brackets and pipes to separate B2B data since newlines are banned.
 */
function formatOrderSummaryForWhatsApp(orderItems: any[]): string {
  if (!orderItems || orderItems.length === 0) return 'No items found.'

  const summaryParts = orderItems.map((item, index) => {
    const productName = item.products?.name || item.name || 'Product'
    const qty = item.quantity || 1
    
    // 1. Base Item
    let itemString = `${orderItems.length > 1 ? index + 1 + '. ' : ''}${productName} (Qty: ${qty})`

    // 2. B2B Customization Details (Inline format: [Print: Single Color | Files: 2 | Note: ...])
    const printType = item.printing_type
    if (printType && printType !== 'None' && printType !== 'Retail (Readymade)') {
      let customDetails = `Print: ${printType}`
      
      const fileCount = item.artwork_urls?.length || 0
      if (fileCount > 0) {
        customDetails += ` | Files: ${fileCount}`
      }

      if (item.printing_instructions) {
        const safeNotes = item.printing_instructions.length > 40 
          ? item.printing_instructions.substring(0, 40) + '...'
          : item.printing_instructions
        customDetails += ` | Note: ${safeNotes}`
      }
      
      itemString += ` [${customDetails}]`
    }

    return itemString
  })

  // Join all products with a distinct inline separator (||) since newlines are banned
  let finalSummary = summaryParts.join(' || ')

  // 🚨 Emergency Meta Safeguard: Strict limit enforcement (1024 chars max)
  if (finalSummary.length > 950) {
    finalSummary = finalSummary.substring(0, 950) + '... (View web dashboard for full details)'
  }

  return finalSummary
}

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
    // 1. Map the text variables for the body (sanitized)
    const components: any[] = [
      {
        type: 'body',
        parameters: bodyParams.map(param => ({
          type: 'text',
          text: sanitizeForMeta(param)
        }))
      }
    ];

    // 2. Map the dynamic URL variable for the button (if it exists) – also sanitized
    if (buttonParam) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: sanitizeForMeta(buttonParam)
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

  const formattedItemsSummary = formatOrderSummaryForWhatsApp(itemsArray);

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
          sanitizeForMeta(order.order_number),       // {{1}}
          sanitizeForMeta(delMethod),                // {{2}}
          sanitizeForMeta(formattedItemsSummary),    // {{3}}
          sanitizeForMeta(totalAmount)               // {{4}}
        ],
        buttonParam // Will be sanitized inside sendWhatsAppTemplate
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
            sanitizeForMeta(order.order_number),                        // {{1}}
            sanitizeForMeta(addressObj.name || order.customer_name),    // {{2}}
            sanitizeForMeta(addressObj.phone),                          // {{3}}
            sanitizeForMeta(adminAddressRaw),                           // {{4}}
            sanitizeForMeta(formattedItemsSummary),                     // {{5}}
            sanitizeForMeta(totalAmount)                                // {{6}}
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