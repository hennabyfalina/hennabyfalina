// src/components/pdf/InvoiceDocument.tsx

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { siteConfig } from '@/config/site'
import { numberToIndianWords } from '@/lib/utils'
import { calculateTaxBreakdown } from '@/lib/tax' 

// Define the styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#4b5563',
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'right',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 3,
    justifyContent: 'flex-end',
  },
  headerLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 70,
  },
  headerValue: {
    fontSize: 10,
    width: 125,
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  addressLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 100,
  },
  addressValue: {
    fontSize: 10,
    flex: 1,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  col1: { width: '8%', textAlign: 'center' },
  col2: { width: '42%' },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '20%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  tableHeaderLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalsBox: {
    width: 250, // Slightly wider to accommodate split layout
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  // 🚨 Enterprise Currency Alignment
  amountContainer: {
    flexDirection: 'row',
    width: 100, 
    justifyContent: 'space-between',
  },
  amountSymbol: {
    fontSize: 10,
    color: '#333',
  },
  amountNumber: {
    fontSize: 10,
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    marginTop: 2,
  },
  grandTotalText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalSymbol: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalNumber: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 15,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  stampContainer: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 2,
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  stampText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  }
})

// Helper to format just the number without the currency symbol
const formatJustNumber = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).replace(',', '').toUpperCase()
}

const formatPhoneNumber = (phone: string) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

export default function InvoiceDocument({ order, invoiceType = 'customer' }: { order: any, invoiceType?: 'customer' | 'merchant' }) {
  const shippingCost = order.shipping_cost ?? (order.total_amount > 1000 ? 0 : 50)
  const subtotal = order.total_amount - shippingCost

  const taxInfo = calculateTaxBreakdown(subtotal)

  const isStorePickup = order.delivery_method === 'pickup' || 
                        order.addresses?.delivery_method === 'pickup' ||
                        order.addresses?.address_line1?.toLowerCase().includes('pickup') || 
                        order.addresses?.address?.toLowerCase().includes('pickup')
  const deliveryMethodLabel = isStorePickup ? 'Store Pickup' : 'Standard Delivery'

  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

  let watermarkText = 'PENDING'
  let watermarkColor = '#d97706' 
  
  if (order.status?.toLowerCase().includes('cancel')) {
    watermarkText = 'CANCELLED'
    watermarkColor = '#dc2626' 
  } else if (order.payment_status?.toLowerCase() === 'paid' || order.payment_status?.toLowerCase() === 'captured' || order.payment_status?.toLowerCase() === 'success') {
    watermarkText = 'PAID'
    watermarkColor = '#15803d' 
  }

  // Pre-process address lines to prevent overlap
  const line1 = order.addresses?.address || order.addresses?.address_line1 || ''
  const line2 = order.addresses?.address_line2 || ''
  const cityPin = `${order.addresses?.city || ''} - ${order.addresses?.pincode || ''}`
  const stateCountry = `${order.addresses?.state || ''}, ${order.addresses?.country || 'India'}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{siteConfig.name}</Text>
            <Text style={styles.text}>{siteConfig.address.line1}</Text>
            <Text style={styles.text}>{siteConfig.address.line2}</Text>
            <Text style={styles.text}>{siteConfig.address.city} - {siteConfig.address.pincode}, {siteConfig.address.state}, {siteConfig.address.country}</Text>
            <Text style={styles.text}>Phone: {siteConfig.contact.phone.primary} | {siteConfig.contact.phone.secondary}</Text>
            <Text style={styles.text}>Email: {siteConfig.contact.email.orders}</Text>
            <Text style={styles.text}>GSTIN: {siteConfig.business.gstin}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>{invoiceType === 'merchant' ? "Owner Tax Invoice" : "Tax Invoice"}</Text>
            
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Order #:</Text>
              <Text style={styles.headerValue}>{order.order_number}</Text>
            </View>
            
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Order Date:</Text>
              <Text style={styles.headerValue}>{formatDate(order.created_at)}</Text>
            </View>
            
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Invoice Date:</Text>
              <Text style={styles.headerValue}>{formatDate(new Date().toISOString())}</Text>
            </View>
            
            <View style={[styles.headerRow, { marginTop: 2 }]}>
              <Text style={styles.headerLabel}>Payment:</Text>
              <Text style={styles.headerValue}>
                Razorpay {capitalize(order.payment_method_detail || order.payment_method || 'Standard')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing & Shipping Address</Text>
          
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Delivery method:</Text>
            <Text style={styles.addressValue}>{deliveryMethodLabel}</Text>
          </View>
          
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Name:</Text>
            <Text style={styles.addressValue}>{order.addresses?.name}</Text>
          </View>
          
          {/* 🚨 RESTRUCTURED ENTERPRISE ADDRESS BLOCK (No Overlaps) 🚨 */}
          {!isStorePickup ? (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Address:</Text>
              <Text style={styles.addressValue}>
                {[line1, line2].filter(Boolean).join(', ')}
                {'\n'}
                {cityPin}
                {'\n'}
                {stateCountry}
              </Text>
            </View>
          ) : (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Pincode:</Text>
              <Text style={styles.addressValue}>{order.addresses?.pincode}</Text>
            </View>
          )}
          
          <View style={[styles.addressRow, { marginTop: 4 }]}>
            <Text style={styles.addressLabel}>Mobile number:</Text>
            <Text style={styles.addressValue}>{formatPhoneNumber(order.addresses?.phone)}</Text>
          </View>
          
          {order.addresses?.landmark && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Landmark:</Text>
              <Text style={styles.addressValue}>{order.addresses.landmark}</Text>
            </View>
          )}
          
          {order.addresses?.delivery_instructions && (
            <View style={styles.addressRow}>
              <Text style={styles.addressLabel}>Instructions:</Text>
              <Text style={styles.addressValue}>{order.addresses.delivery_instructions}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderLabel, styles.col1]}>#</Text>
            <Text style={[styles.tableHeaderLabel, styles.col2]}>Item & Customization</Text>
            <Text style={[styles.tableHeaderLabel, styles.col3]}>Qty</Text>
            <Text style={[styles.tableHeaderLabel, styles.col4]}>Unit Price</Text>
            <Text style={[styles.tableHeaderLabel, styles.col5]}>Total</Text>
          </View>
          
          {order.order_items?.map((item: any, index: number) => (
            <View key={item.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.text, styles.col1]}>{index + 1}</Text>
              
              <View style={styles.col2}>
                <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>{item.products?.name}</Text>
                
                {item.is_bulk_pricing && (
                  <Text style={{ fontSize: 8, color: '#15803d', marginTop: 2 }}>[Bulk Wholesale Price Applied]</Text>
                )}

                {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                  <Text style={{ fontSize: 8, color: '#4b5563', marginTop: 2 }}>
                    Print: {item.printing_type} {(item.artwork_urls && item.artwork_urls.length > 0) ? `[${item.artwork_urls.length} File(s) Uploaded]` : ''}
                  </Text>
                )}

                {item.printing_instructions && (
                  <Text style={{ fontSize: 8, color: '#6b7280', fontStyle: 'italic', marginTop: 1 }}>
                    Note: {item.printing_instructions}
                  </Text>
                )}
              </View>

              <Text style={[styles.text, styles.col3]}>{item.quantity}</Text>
              <View style={styles.col4}>
                <Text style={styles.text}>Rs. {formatJustNumber(item.price)}</Text>
                {item.original_price && item.original_price > item.price && (
                  <Text style={{ fontSize: 8, color: '#6b7280', textDecoration: 'line-through', marginTop: 1 }}>Rs. {formatJustNumber(item.original_price)}</Text>
                )}
              </View>
              <Text style={[styles.text, styles.col5, { fontFamily: 'Helvetica-Bold' }]}>
                Rs. {formatJustNumber(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.stampContainer}>
            <Text style={[styles.stampText, { color: watermarkColor }]}>Payment Status: {watermarkText}</Text>
          </View>

          <View style={styles.totalsBox}>
            {/* 🚨 Split Currency Rendering 🚨 */}
            <View style={styles.totalRow}>
              <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>Taxable Value (Base):</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.amountSymbol}>Rs.</Text>
                <Text style={styles.amountNumber}>{formatJustNumber(taxInfo.basePrice)}</Text>
              </View>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>CGST (9%):</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.amountSymbol}>Rs.</Text>
                <Text style={styles.amountNumber}>{formatJustNumber(taxInfo.cgst)}</Text>
              </View>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>SGST (9%):</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.amountSymbol}>Rs.</Text>
                <Text style={styles.amountNumber}>{formatJustNumber(taxInfo.sgst)}</Text>
              </View>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={[styles.text, { fontFamily: 'Helvetica-Bold' }]}>Shipping & Handling:</Text>
              {shippingCost === 0 ? (
                <View style={styles.amountContainer}>
                  <Text style={styles.amountSymbol}></Text>
                  <Text style={styles.amountNumber}>Free</Text>
                </View>
              ) : (
                <View style={styles.amountContainer}>
                  <Text style={styles.amountSymbol}>Rs.</Text>
                  <Text style={styles.amountNumber}>{formatJustNumber(shippingCost)}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalText}>Grand Total:</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.grandTotalSymbol}>Rs.</Text>
                <Text style={styles.grandTotalNumber}>{formatJustNumber(order.total_amount)}</Text>
              </View>
            </View>
            
            {order.total_amount > 0 && (
              <View style={{ marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                <Text style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic', textAlign: 'right' }}>
                  Amount in words: {numberToIndianWords(order.total_amount)}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Thank you for shopping with {siteConfig.name}!</Text>
          <Text style={styles.text}>Returns & Replacements are eligible within 7 days of delivery.</Text>
          <Text style={styles.text}>If you have any questions about this invoice, please contact us at {siteConfig.contact.email.orders}</Text>
        </View>
      </Page>
    </Document>
  )
}