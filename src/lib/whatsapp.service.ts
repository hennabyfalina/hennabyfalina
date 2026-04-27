// src/lib/whatsapp.service.ts

const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const TOKEN = process.env.WHATSAPP_API_TOKEN;

export const WhatsAppService = {
  
  // ─── 1. Send Order Confirmation to Customer ──────────────────────────────
  async sendCustomerConfirmation(customerPhone: string, orderNumber: string, amount: number, itemsList: string, trackLink: string) {
    const formattedPhone = customerPhone.replace('+', '');
    
    const message = `Hi there! Your order *${orderNumber}* at Razack Packaging Centre is confirmed.\n\n*Order Summary:*\n${itemsList}\n\n*Total Paid:* ₹${amount.toLocaleString('en-IN')}\n\nTrack your order here:\n${trackLink}\n\nThank you for choosing us!`;
    
    return this.sendTextMessage(formattedPhone, message);
  },

  // ─── 2. Send Alert to Admin (Uncle Ismath) ───────────────────────────────
  async sendAdminAlert(adminPhone: string, orderNumber: string, amount: number, customerName: string, itemsList: string) {
    const formattedPhone = adminPhone.replace('+', '');
    
    const message = `NEW ORDER RECEIVED!\n\nOrder: *${orderNumber}*\n👤 Customer: ${customerName}\nAmount: ₹${amount.toLocaleString('en-IN')}\n\n*Items:*\n${itemsList}\n\nPlease check the admin dashboard for full details.`;
    
    return this.sendTextMessage(formattedPhone, message);
  },

  // ─── 3. Core Meta API Fetch Logic ────────────────────────────────────────
  async sendTextMessage(to: string, text: string) {
    if (!TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return { success: false, error: 'Missing ENV variables' };

    try {
      const response = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { preview_url: true, body: text },
        }),
      });

      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      return { success: true, data };
      
    } catch (error) {
      return { success: false, error };
    }
  }
};