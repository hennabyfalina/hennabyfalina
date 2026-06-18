// src/services/whatsapp.service.ts

import 'server-only'; // 🔒 ENTERPRISE LOCK: This file can NEVER be exposed to the internet
import { siteConfig } from '@/config/site';
import { formatCurrency } from '@/lib/utils';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_ADMIN_PHONE = process.env.META_ADMIN_PHONE;

/**
 * 🛠️ STRATEGIC TOGGLE SWITCH: DISABLE NOTIFICATIONS PIPELINE
 * Set this flag to 'true' to completely silence automatic notifications on Vercel.
 * Set this flag to 'false' to restore normal template message routing.
 */
const DISABLE_WHATSAPP_NOTIFICATIONS = true;

// 🛡️ RUTHLESS SANITIZER FOR META API
const sanitizeForMeta = (value: any): string => {
  if (!value) return 'N/A';
  let str = String(value);
  str = str.replace(/[\n\r\t]+/g, ' ');
  str = str.replace(/ {4,}/g, '   ');
  return str.trim();
}

// 🏛️ STANDARD HIGH-VOLUME SUMMARIZER
function getOrderSummary(orderItems: any[]): string {
  if (!orderItems || orderItems.length === 0) return '0 items';
  const totalQty = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  return `${totalQty} item${totalQty > 1 ? 's' : ''}`;
}

// 🚨 CORE TEMPLATE SENDER ENGINE
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParams: any[],
  buttonParam?: string 
) {
  if (DISABLE_WHATSAPP_NOTIFICATIONS) return false;
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

// 🚨 ORDER DISPATCH lifecycle ORCHESTRATOR
export async function notifyOrderConfirmed(order: any) {
  // 🏛️ REJECTION GATEWAY: Returns early when notifications are toggled off
  if (DISABLE_WHATSAPP_NOTIFICATIONS) {
    console.log(`[WhatsApp Dispatch Bypassed] Automated notification muted by feature flag config.`);
    return false;
  }

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
  const deliveryMethodString = isPickup ? 'Store Pickup' : 'Home Delivery';

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
          sanitizeForMeta(order.order_number),
          sanitizeForMeta(deliveryMethodString),
          sanitizeForMeta(unifiedSummary),
          sanitizeForMeta(totalAmount)
        ],
        buttonParam 
      );
      if (sent) successCount++;
    }
  }

  // --- 2. SEND TO ADMIN ---
  if (META_ADMIN_PHONE) {
    const adminPhones = META_ADMIN_PHONE.split(',').map(p => p.trim()).filter(Boolean);
    for (const phone of adminPhones) {
      const adminPhone = formatWhatsAppNumber(phone);
      if (adminPhone) {
        const sent = await sendWhatsAppTemplate(
          adminPhone,
          'admin_order_notification',
          [
            sanitizeForMeta(order.order_number),
            sanitizeForMeta(addressObj.name || order.customer_name),
            sanitizeForMeta(addressObj.phone),
            sanitizeForMeta(deliveryMethodString),
            sanitizeForMeta(adminAddressLine),
            sanitizeForMeta(unifiedSummary),
            sanitizeForMeta(totalAmount)
          ]
        );
        if (sent) successCount++;
      }
    }
  }

  return successCount > 0;
}