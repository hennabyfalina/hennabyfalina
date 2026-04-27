// src/lib/whatsapp.service.ts

const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const TOKEN = process.env.WHATSAPP_API_TOKEN;

export const WhatsAppService = {
  
  // ─── 1. Send Order Confirmation to Customer ──────────────────────────────
  async sendCustomerConfirmation(customerPhone: string, orderId: string, trackLink: string) {
    // Note: Meta requires phone numbers to have the country code but NO plus sign (e.g., '919876543210')
    const formattedPhone = customerPhone.replace('+', '');
    
    const message = `Hi there! Your order #${orderId} at Razack Packaging Centre is confirmed.\n\nTrack your order and download your invoice here:\n${trackLink}\n\nThank you for choosing us!`;
    
    return this.sendTextMessage(formattedPhone, message);
  },

  // ─── 2. Send Alert to Admin (Uncle Ismath) ───────────────────────────────
  async sendAdminAlert(adminPhone: string, orderId: string, amount: number, customerName: string) {
    const formattedPhone = adminPhone.replace('+', '');
    
    const message = `NEW ORDER RECEIVED!\n\nOrder ID: #${orderId}\n👤 Customer: ${customerName}\nAmount: ₹${amount}\n\nPlease check the admin dashboard for full details.`;
    
    return this.sendTextMessage(formattedPhone, message);
  },

  // ─── 3. Core Meta API Fetch Logic ────────────────────────────────────────
  async sendTextMessage(to: string, text: string) {
    if (!TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.error('Missing WhatsApp Environment Variables');
      return { success: false, error: 'Missing ENV variables' };
    }

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
          text: { 
            preview_url: true, 
            body: text 
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Meta API Error:', data.error);
        return { success: false, error: data.error };
      }

      console.log(`WhatsApp message sent successfully to ${to}`);
      return { success: true, data };
      
    } catch (error) {
      console.error('Internal Fetch Error:', error);
      return { success: false, error };
    }
  }
};