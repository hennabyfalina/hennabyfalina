// src/services/whatsapp.service.ts

import 'server-only'; // 🔒 ENTERPRISE LOCK: This file can NEVER be exposed to the internet
import { siteConfig } from '@/config/site';
import { formatCurrency } from '@/lib/utils';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_ADMIN_PHONE = process.env.META_ADMIN_PHONE;

// 🛡️ RUTHLESS SANITIZER FOR META API
const sanitizeForMeta = (value: any): string => {
  if (!value) return 'N/A';
  let str = String(value);
  str = str.replace(/[\n\r\t]+/g, ' ');
  str = str.replace(/ {4,}/g, '   ');
  return str.trim();
}

// 🛡️ THE AMAZON-STYLE MINIMALIST SUMMARIZER (UNIFIED FOR ADMIN & CUSTOMER)
function getOrderSummary(orderItems: any[]): string {
  if (!orderItems || orderItems.length === 0) return '0 items';
  const totalQty = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  
  const hasFiles = orderItems.some(item => {
    const data = item.artwork_urls || item.customization_details?.artwork_urls;
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'string') {
      try { const parsed = JSON.parse(data); if (Array.isArray(parsed)) return parsed.length > 0; } catch { return data.trim().length > 0; }
    }
    return false;
  });

  const hasNotes = orderItems.some(item => {
    const note = item.printing_instructions || item.customization_details?.printing_instructions;
    return typeof note === 'string' && note.trim().length > 0;
  });
  
  if (hasFiles || hasNotes) {
    const detail = hasFiles && hasNotes ? 'Files & Notes' : hasFiles ? 'Files' : 'Notes';
    return `${totalQty} item${totalQty > 1 ? 's' : ''} [Includes ${detail}]`;
  }
  
  const hasCustomType = orderItems.some(i => i.printing_type && i.printing_type !== 'None' && i.printing_type !== 'Retail (Readymade)');
  if (hasCustomType) {
    return `${totalQty} item${totalQty > 1 ? 's' : ''} [Customized]`;
  }

  return `${totalQty} item${totalQty > 1 ? 's' : ''} [Retail]`;
}

// 🚨 CORE TEMPLATE SENDER ENGINE
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParams: any[],
  buttonParam?: string 
) {
  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    console.error('[WhatsApp] Meta credentials missing');
    return false;
  }

  try {
    const components: any[] = [
      {
        type: 'body',
        parameters: bodyParams.map(param => ({
          type: 'text',
          text: sanitizeForMeta(param)
        }))
      }
    ];

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

  const formatWhatsAppNumber = (phone: string) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) cleaned = `91${cleaned}`;
    if (cleaned.length < 11 || cleaned.length > 15) return null;
    return cleaned;
  };

  const itemsArray = order.order_items || order.items || [];
  const unifiedSummary = getOrderSummary(itemsArray);
  const totalAmount = formatCurrency(order.total_amount);

  // 🚨 UNIFIED DELIVERY METHOD LOGIC (Used for both Customer {{2}} and Admin {{4}})
  const deliveryMethodString = isPickup ? 'Store Pickup' : 'Home Delivery';

  // 🚨 SMART FULFILLMENT: Admin Address Line (Variable {{5}})
  let adminAddressLine = '';
  if (isPickup) {
    const pickupPincode = addressObj.pincode || 'N/A';
    adminAddressLine = `Pincode - ${pickupPincode}`;
  } else {
    adminAddressLine = `${addressObj.address_line1 || addressObj.address || ''}`;
    if (addressObj.city) adminAddressLine += `, ${addressObj.city}`;
    if (addressObj.pincode) adminAddressLine += ` - ${addressObj.pincode}`;
    if (addressObj.landmark) adminAddressLine += ` | Landmark: ${addressObj.landmark}`;
    if (addressObj.delivery_instructions) adminAddressLine += ` | Note: ${addressObj.delivery_instructions}`;
  }

  // --- 1. SEND TO CUSTOMER ---
  if (addressObj.phone) {
    const customerPhone = formatWhatsAppNumber(addressObj.phone);
    if (customerPhone) {
      const buttonParam = order.order_number ? encodeURIComponent(String(order.order_number).trim()) : 'UNKNOWN';
      const sent = await sendWhatsAppTemplate(
        customerPhone,
        'customer_order_receipt',
        [
          sanitizeForMeta(order.order_number),       // {{1}} Order ID
          sanitizeForMeta(deliveryMethodString),     // {{2}} Delivery Method
          sanitizeForMeta(unifiedSummary),           // {{3}} Order Summary
          sanitizeForMeta(totalAmount)               // {{4}} Total Paid
        ],
        buttonParam 
      );
      if (sent) successCount++;
    }
  }

  // --- 2. SEND TO ADMIN (UNCLE ISMATH) ---
  if (META_ADMIN_PHONE) {
    const adminPhones = META_ADMIN_PHONE.split(',').map(p => p.trim()).filter(Boolean);

    for (const phone of adminPhones) {
      const adminPhone = formatWhatsAppNumber(phone);
      if (adminPhone) {
        const sent = await sendWhatsAppTemplate(
          adminPhone,
          'admin_order_notification',
          [
            sanitizeForMeta(order.order_number),                        // {{1}} Order ID
            sanitizeForMeta(addressObj.name || order.customer_name),    // {{2}} Customer Name
            sanitizeForMeta(addressObj.phone),                          // {{3}} Phone
            sanitizeForMeta(deliveryMethodString),                      // {{4}} Delivery Method
            sanitizeForMeta(adminAddressLine),                          // {{5}} Address
            sanitizeForMeta(unifiedSummary),                            // {{6}} Order Summary
            sanitizeForMeta(totalAmount)                                // {{7}} Total Paid
          ]
        );
        if (sent) successCount++;
      }
    }
  }

  return successCount > 0;
}