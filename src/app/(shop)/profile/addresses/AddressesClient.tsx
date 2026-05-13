// src/app/(shop)/profile/addresses/AddressesClient.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import AddressForm from '@/components/checkout/AddressForm'

interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  address_line1: string
  address_line2: string | null
  landmark: string | null
  city: string
  state: string
  pincode: string
  country: string
  delivery_instructions: string | null
  is_default: boolean
}

interface AddressesClientProps {
  initialAddresses: Address[]
  userId: string
}

const emptyForm = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  delivery_instructions: '',
  is_default: false
}

export default function AddressesClient({ initialAddresses, userId }: AddressesClientProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [isPhoneValid, setIsPhoneValid] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [originalData, setOriginalData] = useState<typeof emptyForm | null>(null)
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  // Save form data to local storage as a draft whenever it changes
  useEffect(() => {
    if (isModalOpen) {
      const draftKey = editingId ? `address_draft_edit_${editingId}` : 'address_draft_new'
      localStorage.setItem(draftKey, JSON.stringify(formData))
    }
  }, [formData, isModalOpen, editingId])

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    if (name.trim().length > 100) return 'Name is too long'
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) return 'Name can only contain letters'
    return ''
  }

  const validatePincode = (pincode: string): string => {
    const cleanPincode = pincode.replace(/\D/g, '')
    if (!cleanPincode) return 'Pincode is required'
    if (!/^\d{6}$/.test(cleanPincode)) return 'Enter a valid 6-digit pincode'
    return ''
  }

  const validateAddressLine1 = (address: string): string => {
    if (!address.trim()) return 'Address is required'
    if (address.trim().length < 2) return 'Address must be at least 2 characters'
    return ''
  }

  const validateAddressLine2 = (address: string): string => {
    if (!address.trim()) return 'Area, Street, Sector, Village is required'
    if (address.trim().length < 3) return 'Must be at least 3 characters'
    return ''
  }

  const validateCity = (city: string): string => {
    if (!city.trim()) return 'City is required'
    if (city.trim().length < 2) return 'City must be at least 2 characters'
    if (!/^[a-zA-Z\s.-]+$/.test(city.trim())) return 'City can only contain letters'
    return ''
  }

  // 🚨 Updated validation specifically for dropdowns
  const validateState = (state: string): string => {
    if (!state || state.trim() === '') return 'Please select a state'
    return ''
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    newErrors.name = validateName(formData.name)
    newErrors.addressLine1 = validateAddressLine1(formData.addressLine1)
    newErrors.addressLine2 = validateAddressLine2(formData.addressLine2 || '')
    newErrors.city = validateCity(formData.city)
    newErrors.state = validateState(formData.state)
    newErrors.pincode = validatePincode(formData.pincode)
    
    if (!isPhoneValid && formData.phone) {
      newErrors.phone = 'Enter a valid phone number'
    } else if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    }
    
    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === '')
  }

  const openAddModal = () => {
    if (addresses.length >= 2) {
      showToast('You can only have up to 2 saved addresses.')
      return
    }
    const baseForm = { ...emptyForm, is_default: addresses.length === 0 }
    let initial = { ...baseForm }
    
    try {
      const draft = localStorage.getItem('address_draft_new')
      if (draft) {
        initial = { ...initial, ...JSON.parse(draft) }
      }
    } catch (e) {
      console.error('Failed to parse address draft', e)
    }
    
    setFormData(initial)
    setOriginalData(baseForm)
    setEditingId(null)
    setErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (addr: Address) => {
    const baseForm = {
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country || 'India',
      delivery_instructions: addr.delivery_instructions || '',
      is_default: addr.is_default
    }
    let initial = { ...baseForm }
    
    try {
      const draft = localStorage.getItem(`address_draft_edit_${addr.id}`)
      if (draft) {
        initial = { ...initial, ...JSON.parse(draft) }
      }
    } catch (e) {
      console.error('Failed to parse address draft', e)
    }
    
    setFormData(initial)
    setOriginalData(baseForm)
    setEditingId(addr.id)
    setErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast('Please fix the errors in the form.')
      return
    }

    setIsSaving(true)

    try {
      let result: any; 

      if (editingId) {
        const { data, error } = await supabase
          .from('addresses')
          .update({
            name: formData.name,
            phone: formData.phone,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2 || null,
            landmark: formData.landmark || null,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: formData.country,
            delivery_instructions: formData.delivery_instructions || null,
          })
          .eq('id', editingId)
          .select()
          .single()
        
        if (error) throw error
        result = data
        
        setAddresses(addresses.map(a => a.id === editingId ? result : a))
        showToast('Address updated successfully')

      } else {
        if (addresses.length >= 2) {
          showToast('You can only have up to two addresses.')
          setIsModalOpen(false)
          return
        }

        const { data, error } = await supabase
          .from('addresses')
          .insert({ 
            name: formData.name,
            phone: formData.phone,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2 || null,
            landmark: formData.landmark || null,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: formData.country,
            delivery_instructions: formData.delivery_instructions || null,
            user_id: userId 
          })
          .select()
          .single()

        if (error) throw error
        result = data

        setAddresses([...addresses, result])
        showToast('Address added successfully')
      }

      const draftKey = editingId ? `address_draft_edit_${editingId}` : 'address_draft_new'
      localStorage.removeItem(draftKey)

      setIsModalOpen(false)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'An error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmRemove = (id: string) => {
    setDeleteConfirmId(id)
  }

  const executeRemove = async () => {
    if (!deleteConfirmId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase.from('addresses').delete().eq('id', deleteConfirmId)
      if (error) throw error
      setAddresses(addresses.filter(a => a.id !== deleteConfirmId))
      showToast('Address removed')
    } catch (error: any) {
      showToast('Failed to remove address')
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const handlePhoneValidation = (isValid: boolean) => {
    setIsPhoneValid(isValid)
    if (!isValid && formData.phone) {
      setErrors(prev => ({ ...prev, phone: 'Enter a valid phone number' }))
    } else {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handleFormChange = (field: any, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClearAddressForm = () => {
    setFormData({ ...emptyForm, is_default: addresses.length === 0 })
    setIsPhoneValid(true)
    setErrors({})
  }

  const hasValidationErrors = Object.values(errors).some(err => err !== '')
  const isFormFilled = Boolean(
    formData.name.trim() &&
    formData.phone &&
    isPhoneValid &&
    formData.addressLine1.trim() &&
    formData.addressLine2?.trim() &&
    formData.city.trim() &&
    formData.state &&
    formData.pincode.replace(/\D/g, '').length === 6
  )
  const isDirty = !editingId || JSON.stringify(formData) !== JSON.stringify(originalData)
  const isButtonDisabled = isSaving || !isFormFilled || hasValidationErrors || !isDirty

  return (
    <div className="min-h-screen bg-white py-6 md:py-10 relative" style={{ colorScheme: 'light' }}>
      <Container className="max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-4">
          <Link href="/profile">Your Account</Link> <span className="text-gray-500 mx-1">›</span> <span className="text-[#C7511F]">Your Addresses</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-6 tracking-tight">Your Addresses</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {addresses.length < 2 && (
            <button 
              onClick={openAddModal}
              className="h-[280px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors group cursor-pointer shadow-sm"
            >
              <Plus className="w-12 h-12 text-gray-400 group-hover:text-gray-600 transition-colors mb-2" strokeWidth={1.5} />
              <span className="text-lg font-bold text-gray-600 group-hover:text-gray-900">Add Address</span>
            </button>
          )}

          {addresses.map((addr, index) => (
            <div key={addr.id} className="h-[280px] border border-gray-300 rounded-lg p-5 flex flex-col shadow-sm relative bg-white">
              <div className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-200 pb-2">
                {index === 0 ? 'Primary Address' : 'Secondary Address'}
              </div>
              <div className="flex-1 text-sm text-gray-900 leading-relaxed overflow-hidden">
                <p className="font-bold">{addr.name}</p>
                <p className="mt-1">{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} {addr.pincode}</p>
                <p>{addr.country}</p>
                <p className="mt-2">Phone number: {addr.phone}</p>
              </div>
              
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200 text-sm">
                <button 
                  onClick={() => openEditModal(addr)} 
                  className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button 
                  onClick={() => confirmRemove(addr.id)} 
                  className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

        </div>
      </Container>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ colorScheme: 'light' }}>
          <div className="bg-white rounded-md shadow-xl max-w-sm w-full p-6 text-center border border-gray-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-normal text-gray-900 mb-2">Remove Address</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove this address? You can add it back later if needed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm font-normal text-gray-900 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeRemove}
                disabled={isDeleting}
                className="flex-1 py-2 text-sm font-normal text-gray-900 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Removing...' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ colorScheme: 'light' }}>
           <div className="relative w-full max-w-2xl bg-[#F0F2F2] rounded-sm shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
             <div className="flex items-center justify-between p-4 bg-white border-b border-[#D5D9D9] shrink-0">
                <h3 className="text-lg font-bold text-[#0F1111]">{editingId ? "Update your address" : "Add a new address"}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-sm cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto overscroll-contain p-4">
             <AddressForm
               formData={formData as any}
               onChange={handleFormChange}
               onPhoneValidationChange={handlePhoneValidation}
               shippingMethod="delivery"
               disabled={isSaving}
               onClear={handleClearAddressForm}
             />
           </div>

               <div className="p-4 bg-white border-t border-[#D5D9D9] shrink-0 flex justify-end">
                 <button
                   type="button"
                   onClick={handleSave}
                   disabled={isButtonDisabled}
                   className="w-full sm:w-auto py-2.5 px-6 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-sm text-sm font-bold text-[#0F1111] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                 >
                   {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add address'}
                 </button>
               </div>
  
           </div>
        </div>
      )}
    </div>
  )
}