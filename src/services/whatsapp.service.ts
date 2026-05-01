// src/services/whatsapp.service.ts

import { siteConfig } from '@/config/site';
import { formatCurrency, numberToIndianWords } from '@/lib/utils';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER;

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    console.error('[WhatsApp] Meta credentials missing in environment variables');
    return false;
  }

  try {
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
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] API Error:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp] Network Error:', error);
    return false;
  }
}

// ==========================================
// CLEAN CUSTOMER MESSAGE
// ==========================================
function formatCustomerOrderMessage(order: any): string {
  const itemsArray = order.order_items || order.items || [];
  const itemsList = itemsArray.map((item: any) => {
    const productName = item.products?.name || item.name || 'Product';
    // 🚨 UPGRADED: Add file count to WhatsApp receipt
    const fileCount = item.artwork_urls?.length || 0;
    const attachmentText = fileCount > 0 ? ` [${fileCount} File(s) Attached]` : '';
    return `- ${item.quantity}x ${productName}${attachmentText}`;
  }).join('\n');

  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/order/${order.order_number}`;
  const payMethod = order.payment_method === 'razorpay' ? 'Prepaid (Razorpay)' : (order.payment_method || 'N/A');
  const delMethod = order.delivery_method === 'pickup' || order.addresses?.delivery_method === 'pickup' ? 'Store Pickup' : 'Home Delivery';
  
  const formattedAmount = formatCurrency(order.total_amount); 
  const amountWords = numberToIndianWords(order.total_amount);

  return `Order Confirmation\n${siteConfig.name}\n\n` +
         `Dear ${order.customer_name},\n` +
         `Your order *${order.order_number}* has been successfully placed.\n\n` +
         `*Order Summary:*\n${itemsList}\n\n` +
         `*Delivery:* ${delMethod}\n` +
         `*Payment:* ${payMethod}\n` +
         `*Total Paid:* ${formattedAmount} (${amountWords})\n\n` +
         `Track your order securely here:\n${orderUrl}\n\n` +
         `Thank you for shopping with us.`;
}

// ==========================================
// CLEAN ADMIN MESSAGE (With DB Mapping & Landmarks)
// ==========================================
function formatAdminOrderMessage(order: any): string {
  const itemsArray = order.order_items || order.items || [];
  const itemsList = itemsArray.map((item: any) => {
    const productName = item.products?.name || item.name || 'Product';
    // 🚨 UPGRADED: Alert Uncle on WhatsApp if files need downloading
    const fileCount = item.artwork_urls?.length || 0;
    const attachmentText = fileCount > 0 ? ` [${fileCount} File(s) Attached]` : '';
    return `- ${item.quantity}x ${productName}${attachmentText}`;
  }).join('\n');
  
  // Smart mapping for the addresses table
  const addressObj = order.addresses || order.shipping_address || {};
  const line1 = addressObj.address_line1 || addressObj.address || '';
  
  let addressDetails = 'Store Pickup / No Address Provided';
  
  if (line1) {
    addressDetails = `${line1}, ${addressObj.city || ''} - ${addressObj.pincode || ''}`;
    
    if (addressObj.landmark) {
      addressDetails += `\n*Landmark:* ${addressObj.landmark}`;
    }
    
    const notes = order.delivery_instructions || order.notes || addressObj.delivery_instructions;
    if (notes) {
      addressDetails += `\n*Instructions:* ${notes}`;
    }
  }
    
  const phone = addressObj.phone || 'N/A';
  const payMethod = order.payment_method === 'razorpay' ? 'Prepaid (Razorpay)' : (order.payment_method || 'N/A');
  const delMethod = order.delivery_method === 'pickup' || addressObj.delivery_method === 'pickup' ? 'Store Pickup' : 'Home Delivery';

  const formattedAmount = formatCurrency(order.total_amount);
  const amountWords = numberToIndianWords(order.total_amount);

  return `New Order Received\n\n` +
         `*Order ID:* ${order.order_number}\n` +
         `*Customer:* ${order.customer_name}\n` +
         `*Phone:* ${phone}\n` +
         `*Address:* ${addressDetails}\n\n` +
         `*Delivery:* ${delMethod}\n` +
         `*Payment:* ${payMethod}\n` +
         `*Total Amount:* ${formattedAmount} (${amountWords})\n\n` +
         `*Items:*\n${itemsList}\n\n` +
         `Please check the admin dashboard to process this order.`;
}

export async function notifyOrderConfirmed(order: any) {
  let successCount = 0;
  
  const addressObj = order.addresses || order.shipping_address || {};

  // 1. Send to Customer
  if (addressObj.phone) {
    let customerPhone = addressObj.phone.replace(/\D/g, '');
    if (customerPhone.length === 10) customerPhone = `91${customerPhone}`;
    
    const customerMsg = formatCustomerOrderMessage(order);
    const sent = await sendWhatsAppMessage(customerPhone, customerMsg);
    if (sent) successCount++;
  }

  // 2. Send to Admin (Uncle Ismath)
  if (ADMIN_PHONE_NUMBER) {
    let adminPhone = ADMIN_PHONE_NUMBER.replace(/\D/g, '');
    const adminMsg = formatAdminOrderMessage(order);
    const sent = await sendWhatsAppMessage(adminPhone, adminMsg);
    if (sent) successCount++;
  }

  return successCount > 0;
}