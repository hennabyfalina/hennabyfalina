export const siteConfig = {
  name: "Razack Packaging Centre",
  shortName: "Razack Packaging Centre",
  description: "We are a packaging materials supplier based in India serving retail & wholesale customers since 1990. Your trusted partner for premium packaging solutions.",
  contact: {
    phone: {
      primary: "+91 94443 32283",
      secondary: "+91 63831 51922",
    },
    email: {
      orders: "orders@razackpackagingcentre.com",
      support: "support@razackpackagingcentre.com",
      general: "info@razackpackagingcentre.com",
    },
    whatsapp: "+91 63831 51922",
  },
  address: {
    line1: "195, N.S.C Bose Road (Olympic Habib Complex)",
    line2: "",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    country: "India",
    mapUrl: "https://goo.gl/maps/...", // Google Maps share link
  },
  business: {
    gstin: "33AATPI7728L1Z3",
    workingHours: "Mon - Sat: 10:00 AM - 8:00 PM (Sunday Closed)",
  },
  socialLinks: {
    instagram: "https://instagram.com/razackpackaging",
    facebook: "https://facebook.com/razackpackaging",
    twitter: "https://twitter.com/razackpackaging",
  },
} as const;

export type SiteConfig = typeof siteConfig;
