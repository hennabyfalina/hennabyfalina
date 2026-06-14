export const siteConfig = {
  name: "Henna by Falina",
  shortName: "HB Falina",
  description: "Premium, skin-safe organic henna products crafted in Chennai. Freshly batched and dispatched daily.",
  contact: {
    phone: {
      primary: "+91 63820 94394",
      secondary: "+91 73586 71248",
    },
    email: {
      orders: "orders@hennabyfalina.com",
      support: "support@hennabyfalina.com",
      general: "info@hennabyfalina.com",
    },
    whatsapp: "+91 63820 94394",
  },
  address: {
    line1: "No. 43, St. Xavier Street, Second Floor",
    line2: "Seven Wells, Broadway, George Town",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    country: "India",
    mapUrl: "https://www.google.com/maps?sca_esv=9bf71fb085e6e221&output=search&q=St.+Xavier+Street&source=lnms&fbs=ADc_l-aN0CWEZBOHjofHoaMMDiKpaEWjvZ2Py1XXV8d8KvlI3kj_s5Jds98_ubVRf0unUVuttyzNArKNIU5GZzx4Y5djOSi5iUTuvdmR-KzdLKnPc8J97gJtmVeaOWsKOxlqo4TcVZ7ft1dMtClAqeNC9y2mJ8P_pAdCMwFy46j5j2tvTqUS2_V68iNK_vv2E5tQyCDxasV3OS5zCGOxACnsQOGmKPQxbA&entry=mc&ved=1t:200715&ictx=111", // Google Maps share link
  },
  business: {
    gstin: "",
    workingHours: "Mon - Sun (9:00 AM - 9:00 PM)",
  },
  socialLinks: {
    instagram: "https://instagram.com/hennabyfalina",
    facebook: "https://facebook.com/hennabyfalina",
    twitter: "https://x.com/hennabyfalina",
  },
} as const;

export type SiteConfig = typeof siteConfig;
