export const siteConfig = {
  name: "Razack Packaging Centre",
  shortName: "Razack Packaging Centre",
  description: "We are a packaging materials supplier based in India serving retail & wholesale customers since 1990. Your trusted partner for premium packaging solutions.",
  contact: {
    phone: {
      primary: "+91 63831 51922",
      secondary: "+91 94443 32283",
    },
    email: {
      orders: "orders@razackpackagingcentre.com",
      support: "support@razackpackagingcentre.com",
      general: "info@razackpackagingcentre.com",
    },
    whatsapp: "+91 63831 51922",
  },
  address: {
    line1: "No. 25, Anderson Street, N.S.C. Bose Road",
    line2: "(Olympic Habib Complex), Flower Bazaar, George Town",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    country: "India",
    mapUrl: "https://www.google.com/maps/place/Razack+Packaging+Centre/@13.088911,80.2837631,18.21z/data=!3m1!5s0x3a526f5161115015:0xc18a13f16f32378d!4m6!3m5!1s0x3a526f4fccaece91:0xcfabdef606f515db!8m2!3d13.0887343!4d80.283837!16s%2Fg%2F1tfpy8dz?entry=ttu&g_ep=EgoyMDI2MDQyMi4wIKXMDSoASAFQAw%3D%3D", // Google Maps share link
  },
  business: {
    gstin: "33AATPI7728L1Z3",
    workingHours: "Mon - Sun (10:00 AM - 10:00 PM)",
  },
  socialLinks: {
    instagram: "https://instagram.com/razackpackagingcentre",
    facebook: "https://facebook.com/razackpackagingcentre",
    twitter: "https://x.com/razackpackagingcentre",
  },
} as const;

export type SiteConfig = typeof siteConfig;
