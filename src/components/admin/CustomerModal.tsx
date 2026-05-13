// src/components/admin/CustomerModal.tsx

'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import AdminConfirmModal from '@/components/admin/layout/AdminConfirmModal'
import { showToast } from '@/components/ui/Toast'
import { User, MapPin, Phone as PhoneIcon, Mail, Trash2, ShieldAlert, History, ShoppingBag, Printer } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { INDIAN_STATES } from '@/lib/states' // 🚨 Integrating your states file
import AdminPhoneInput from '@/components/admin/AdminPhoneInput'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateTaxBreakdown } from '@/lib/tax'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'

interface CustomerFormData {
  name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  country: string
}

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer?: any // null if adding new
  onSuccess: () => void
}

export default function CustomerModal({ isOpen, onClose, customer, onSuccess }: CustomerModalProps) {
  const { isSuperAdmin } = useAuth()
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '', email: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India'
  })
  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'history'>('profile')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address_line1: customer.addresses?.[0]?.address_line1 || '',
        address_line2: customer.addresses?.[0]?.address_line2 || '',
        city: customer.addresses?.[0]?.city || '',
        state: customer.addresses?.[0]?.state || '',
        pincode: customer.addresses?.[0]?.pincode || '',
        country: customer.addresses?.[0]?.country || 'India',
      })
    } else {
      setFormData({ name: '', email: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India' })
    }
    setErrors({})
    setIsPhoneValid(true)
  }, [customer, isOpen])

  useEffect(() => {
    if (activeTab === 'history' && customer?.id) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true)
        try {
          const res = await fetch(`/api/admin/orders?user_id=${customer.id}`)
          if (!res.ok) throw new Error('Failed to fetch history')
          const data = await res.json()
          setOrderHistory(data)
        } catch(e) {
          showToast('Failed to load order history', 'error')
        } finally {
          setIsLoadingHistory(false)
        }
      }
      fetchHistory()
    }
  }, [activeTab, customer?.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!customer && !formData.email.trim()) newErrors.email = 'Email address is required'
    if (formData.phone && !isPhoneValid) newErrors.phone = 'Please enter a valid phone number'
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode.replace(/\D/g, ''))) newErrors.pincode = 'Valid 6-digit pincode is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Please fix the errors before saving', 'error')
      // Auto-switch to the tab with errors
      if (errors.name || errors.email || errors.phone) setActiveTab('profile')
      else setActiveTab('address')
      return
    }

    setIsSubmitting(true)
    
    try {
      const endpoint = customer ? `/api/admin/customers/${customer.id}` : `/api/admin/customers`
      const method = customer ? 'PATCH' : 'POST'
      
      // 🚨 Ensure we send the ID and strip the email on PATCH (Supabase rejects email updates without Auth Admin)
      const payload: any = { ...formData, id: customer?.id }
      if (customer) delete payload.email 

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save customer data')
      
      showToast(`Customer ${customer ? 'updated' : 'added'} successfully`, 'success')
      onSuccess()
      onClose()
    } catch (error: any) {
      showToast(error.message || 'Error saving customer', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete customer')
      
      showToast('Customer permanently deleted', 'success')
      setShowDeleteConfirm(false)
      onSuccess()
      onClose()
    } catch (error: any) {
      showToast(error.message || 'Error deleting customer', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = (hasError: boolean) => `w-full px-4 py-3 bg-[#131314] border ${hasError ? 'border-[#8C1D18] ring-1 ring-[#8C1D18]' : 'border-[#333538]'} text-[#E3E3E3] placeholder:text-[#565959] rounded-2xl focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all`
  const labelClass = "block text-[11px] font-bold text-[#8E9196] mb-1.5 ml-1 uppercase tracking-wider"
  const errorClass = "text-[#F2B8B5] text-[10px] font-medium mt-1 ml-1"

  return (
    <div style={{ colorScheme: 'dark' }}>
      <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Edit Customer' : 'Add New Customer'}>
        <div className="border-b border-[#333538] mb-6">
          <nav className="flex gap-2 min-w-max pb-px">
            <button type="button" onClick={() => setActiveTab('profile')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'profile' ? 'border-[#A8C7FA] text-[#A8C7FA]' : 'border-transparent text-[#8E9196] hover:text-[#E3E3E3]'}`}>Profile</button>
            <button type="button" onClick={() => setActiveTab('address')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === 'address' ? 'border-[#A8C7FA] text-[#A8C7FA]' : 'border-transparent text-[#8E9196] hover:text-[#E3E3E3]'}`}>Shipping Info</button>
            {customer && (
              <button type="button" onClick={() => setActiveTab('history')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'history' ? 'border-[#A8C7FA] text-[#A8C7FA]' : 'border-transparent text-[#8E9196] hover:text-[#E3E3E3]'}`}><History className="w-4 h-4"/> Order History</button>
            )}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className={labelClass}><User className="w-3 h-3 inline mr-1" /> Full Name <span className="text-[#F2B8B5]">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass(!!errors.name)} placeholder="e.g. John Doe" />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}><Mail className="w-3 h-3 inline mr-1" /> Email Address <span className="text-[#F2B8B5]">*</span></label>
                <input type="email" name="email" title="Email Address" value={formData.email} onChange={handleChange} disabled={!!customer} className={`${inputClass(!!errors.email)} ${customer ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="customer@example.com" />
                {customer && <p className="text-[10px] text-[#565959] mt-1 ml-1">Email cannot be changed after account creation.</p>}
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>
              <div>
                <label className={labelClass}><PhoneIcon className="w-3 h-3 inline mr-1" /> Phone Number</label>
                <AdminPhoneInput
                  value={formData.phone}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, phone: val }))
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
                  }}
                  onValidationChange={setIsPhoneValid}
                  error={errors.phone}
                />
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <label className={labelClass}><MapPin className="w-3 h-3 inline mr-1" /> Address Line 1</label>
                <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} className={inputClass(false)} placeholder="Street address, building, company" />
              </div>
              <div>
                <label className={labelClass}>Address Line 2</label>
                <input type="text" name="address_line2" value={formData.address_line2} onChange={handleChange} className={inputClass(false)} placeholder="Apartment, suite, unit, etc. (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="city" title="City" placeholder="City" value={formData.city} onChange={handleChange} className={inputClass(false)} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <select name="state" title="State" value={formData.state} onChange={handleChange as any} className={`${inputClass(false)} appearance-none cursor-pointer`}>
                  <option value="" className="bg-[#1E1F20] text-[#E3E3E3]">Select State</option>
                    {INDIAN_STATES?.map((st: any) => (
                    <option key={st.value || st.name || st} value={st.value || st.name || st} className="bg-[#1E1F20] text-[#E3E3E3]">
                        {st.label || st.name || st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input type="text" name="pincode" title="Pincode" placeholder="Pincode" value={formData.pincode} onChange={(e) => setFormData(p => ({...p, pincode: e.target.value.replace(/\D/g, '')}))} maxLength={6} className={inputClass(!!errors.pincode)} />
                  {errors.pincode && <p className={errorClass}>{errors.pincode}</p>}
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input type="text" name="country" title="Country" placeholder="Country" value={formData.country} onChange={handleChange} className={inputClass(false)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-[#333538] border-t-[#A8C7FA] rounded-full animate-spin mb-4" />
                  <p className="text-sm text-[#8E9196]">Loading purchase history...</p>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <ShoppingBag className="w-12 h-12 text-[#333538] mb-3" />
                  <h3 className="text-base font-medium text-[#E3E3E3]">No Orders Found</h3>
                  <p className="text-sm text-[#8E9196] text-center mt-1">This customer hasn't placed any orders yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar pb-2">
                  {orderHistory.map(order => {
                    const taxInfo = calculateTaxBreakdown(order.total_amount - (order.shipping_cost || 0))
                    const isPickup = order.shipping_method === 'pickup' || order.addresses?.[0]?.delivery_method === 'pickup' || (order.addresses?.[0]?.address_line1 || '').toLowerCase().includes('pickup')
                    
                    return (
                      <div key={order.id} className="bg-[#131314] rounded-[20px] border border-[#333538] p-5 hover:border-[#44474A] transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[11px] text-[#8E9196] uppercase tracking-widest font-bold mb-1">{formatDate(order.created_at)}</p>
                            <p className="font-mono text-sm font-bold text-[#A8C7FA]">{order.order_number}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="text-base font-bold text-[#E3E3E3]">{formatCurrency(order.total_amount)}</p>
                            <OrderStatusBadge status={order.status} type="order" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs text-[#C4C7C5] bg-[#1E1F20] p-3 rounded-2xl mb-4 border border-[#333538]">
                          <div>
                            <span className="text-[#8E9196] block mb-0.5">Payment</span> 
                            <span className="font-medium capitalize">{order.payment_method_detail || 'Standard'}</span>
                            <span className={`ml-1 ${order.payment_status === 'paid' ? 'text-[#93D7A4]' : 'text-[#F9AB00]'}`}>({order.payment_status})</span>
                          </div>
                          <div>
                            <span className="text-[#8E9196] block mb-0.5">Delivery</span> 
                            <span className="font-medium">{isPickup ? 'Store Pickup' : 'Home Delivery'}</span>
                            <span className="ml-1 text-[#8E9196]">{order.shipping_cost ? `(${formatCurrency(order.shipping_cost)})` : '(Free)'}</span>
                          </div>
                          <div>
                            <span className="text-[#8E9196] block mb-0.5">Taxable Value</span> 
                            <span className="font-mono">{formatCurrency(taxInfo.basePrice)}</span>
                          </div>
                          <div>
                            <span className="text-[#8E9196] block mb-0.5">Total GST (18%)</span> 
                            <span className="font-mono">{formatCurrency(taxInfo.totalGST)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] text-[#8E9196] uppercase tracking-widest font-bold">Ordered Items</p>
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="bg-[#1E1F20] rounded-xl p-3 border border-[#333538]">
                              <div className="flex justify-between items-start gap-4">
                                <span className="font-medium text-[#E3E3E3] text-sm">{item.products?.name || 'Product'}</span>
                                <span className="font-mono text-sm text-[#C4C7C5] whitespace-nowrap">{item.quantity} x {formatCurrency(item.price)}</span>
                              </div>
                              {item.printing_type && item.printing_type !== 'None' && item.printing_type !== 'Retail (Readymade)' && (
                                <div className="mt-2 text-[11px] text-[#A8C7FA] bg-[#0B57D0]/10 p-2 rounded-lg border border-[#0B57D0]/20">
                                  <p className="font-bold flex items-center gap-1.5"><Printer className="w-3 h-3"/> Print: {item.printing_type}</p>
                                  {item.printing_instructions && <p className="mt-1 text-[#C4C7C5] italic">"{item.printing_instructions}"</p>}
                                  {item.artwork_urls?.length > 0 && <p className="mt-1 font-medium">{item.artwork_urls.length} Attached File(s)</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab !== 'history' && (
            <div className="pt-4 border-t border-[#333538] flex flex-col gap-3">
              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#0B57D0] text-white font-bold rounded-full hover:bg-[#0842A0] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-900/20">
                {isSubmitting ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
              </button>
              {customer && isSuperAdmin && (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full py-3.5 bg-transparent border border-[#4D2628] text-[#F2B8B5] font-bold rounded-full hover:bg-[#4D2628] transition-all cursor-pointer">
                  Delete Customer
                </button>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* 🚨 2-STEP DELETE VERIFICATION 🚨 */}
      <AdminConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Purge Customer Data?"
        description={`You are about to completely delete the account and data for "${customer?.name}".`}
        confirmText="Delete Customer"
        isDestructive={true}
        requireMatch="DELETE" 
        isLoading={isSubmitting}
      />
    </div>
  )
}