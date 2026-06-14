// src/app/(shop)/profile/addresses/AddressesClient.tsx

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Container from '@/components/ui/Container'
import { Plus, X, ChevronRight, MapPin, Trash2, Pencil } from 'lucide-react'
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
    if (name.trim().length > 100) return 'Name configuration is too long'
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) return 'Name can only contain letters'
    return ''
  }

  const validatePincode = (pincode: string): string => {
    const cleanPincode = pincode.replace(/\D/g, '')
    if (!cleanPincode) return 'Pincode indicator is required'
    if (!/^\d{6}$/.test(cleanPincode)) return 'Enter a valid 6-digit pincode structure'
    return ''
  }

  const validateAddressLine1 = (address: string): string => {
    if (!address.trim()) return 'Address specifications are required'
    if (address.trim().length < 2) return 'Address details must be longer'
    return ''
  }

  const validateAddressLine2 = (address: string): string => {
    if (!address.trim()) return 'Locality parameters are required'
    if (address.trim().length < 3) return 'Must be at least 3 characters long'
    return ''
  }

  const validateCity = (city: string): string => {
    if (!city.trim()) return 'Town or city location is required'
    if (city.trim().length < 2) return 'City name parameter must be valid'
    if (!/^[a-zA-Z\s.-]+$/.test(city.trim())) return 'City field can only contain letters'
    return ''
  }

  const validateState = (state: string): string => {
    if (!state || state.trim() === '') return 'Please select an options state location'
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
      newErrors.phone = 'Enter a valid phone number tracking structure'
    } else if (!formData.phone) {
      newErrors.phone = 'Phone contact is required'
    }
    
    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === '')
  }

  const openAddModal = () => {
    if (addresses.length >= 2) {
      showToast('You can only store up to 2 distinct address hubs.')
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
      console.error('Failed to parse address cache draft', e)
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
      console.error('Failed to parse address cache draft', e)
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
      showToast('Please clear outstanding form parameters configuration errors.')
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
        showToast('Address logs updated successfully', 'success')

      } else {
        if (addresses.length >= 2) {
          showToast('Maximum saved address boundaries reached.')
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
        showToast('New address registered securely', 'success')
      }

      const draftKey = editingId ? `address_draft_edit_${editingId}` : 'address_draft_new'
      localStorage.removeItem(draftKey)

      setIsModalOpen(false)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'An explicit database saving failure occurred.')
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
      showToast('Address record cleared from profile', 'success')
    } catch (error: any) {
      showToast('Failed to clear destination address logs')
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const handlePhoneValidation = (isValid: boolean) => {
    setIsPhoneValid(isValid)
    if (!isValid && formData.phone) {
      setErrors(prev => ({ ...prev, phone: 'Enter a valid verification phone number' }))
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
    <div className="min-h-screen bg-white py-8 md:py-14 relative select-none font-sans antialiased text-left" style={{ colorScheme: 'light' }}>
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Breadcrumb Links */}
        <div className="text-[13px] font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center gap-1">
          <Link href="/profile">Your Account</Link> 
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" /> 
          <span className="text-gray-900">Your Addresses</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 mb-8 tracking-tight capitalize">Your Addresses</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Add New Address Trigger Wireframe Panel Card */}
          {addresses.length < 2 && (
            <button 
              onClick={openAddModal}
              className="h-[280px] border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-gray-950 bg-white hover:border-gray-900 transition-all group cursor-pointer shadow-none outline-none"
            >
              <Plus className="w-10 h-10 text-gray-300 group-hover:text-gray-950 transition-colors mb-2.5" strokeWidth={1.8} />
              <span className="text-[16px] font-bold text-gray-400 group-hover:text-gray-900 capitalize tracking-tight">Add Address</span>
            </button>
          )}

          {/* Rendered Existing Addresses Stack cards */}
          {addresses.map((addr, index) => (
            <div key={addr.id} className="h-[280px] border border-gray-100 rounded-2xl p-5 flex flex-col bg-white transition-shadow hover:shadow-md">
              
              <div className="text-[15px] font-semibold text-gray-400 mb-3 border-b border-gray-50 pb-2.5 normal tracking-wide">
                {index === 0 ? 'Primary' : 'Secondary'}
              </div>
              
              <div className="flex-1 text-[14px] sm:text-[15px] text-gray-600 leading-relaxed font-normal overflow-hidden capitalize space-y-0.5">
                <p className="font-bold text-gray-950 text-[15px] sm:text-[16px] mb-1">{addr.name}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} <span className="font-semibold text-gray-950">({addr.pincode})</span></p>
                <p className="normal-case">{addr.country}</p>
                <p className="pt-2 text-gray-400 font-medium">Contact link: <span className="text-gray-800 font-semibold tracking-wide">{addr.phone}</span></p>
              </div>
              
              {/* Bottom Action Control Row Panel */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 text-[13px] sm:text-[14px] font-semibold">
                <button 
                  onClick={() => openEditModal(addr)} 
                  className="text-gray-500 hover:text-gray-950 transition-colors flex items-center gap-1 cursor-pointer outline-none capitalize"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.8} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => confirmRemove(addr.id)} 
                  className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer outline-none capitalize"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-500" strokeWidth={1.8} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}

        </div>
      </Container>

      {/* ========================================================================= */}
      {/* DELETE VALIDATION ACTION SHEET OVERLAY DIALOG MODAL PORTAL SHEET          */}
      {/* ========================================================================= */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" style={{ colorScheme: 'light' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-left border border-gray-50 animate-zoom-in">
            <h3 className="text-[18px] font-semibold text-gray-900 mb-1.5 capitalize">Remove Saved Hub Address?</h3>
            <p className="text-[14px] text-gray-500 font-medium mb-6 leading-relaxed">
              Are you sure you want to completely discard this address configuration registry? This block can be re-added safely inside a later session.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 text-[14px] font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-colors cursor-pointer capitalize outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRemove}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 text-[14px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-30 cursor-pointer capitalize outline-none shadow-none"
              >
                {isDeleting ? 'Removing...' : 'Yes, Remove Hub'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* EDIT/ADD MANAGEMENT CANVAS DRAWER DIALOG INTERFACE SHEET MODAL PORTAL     */}
      {/* ========================================================================= */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" style={{ colorScheme: 'light' }}>
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)} style={{ touchAction: 'none' }} />
          
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-zoom-in flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
            {/* Header Title Section Bar */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 bg-white">
              <h3 className="text-[17px] sm:text-[18px] font-bold text-gray-950 capitalize">{editingId ? "Update Saved Address Hub" : "Register New Address Hub"}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-stone-50 border border-transparent hover:border-gray-100 rounded-lg transition-colors cursor-pointer outline-none text-gray-400 hover:text-gray-950">
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
             
            {/* Embedded Form Field Slate Component */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 no-scrollbar bg-white">
              <AddressForm
                formData={formData as any}
                onChange={handleFormChange}
                onPhoneValidationChange={handlePhoneValidation}
                shippingMethod="delivery"
                disabled={isSaving}
                onClear={handleClearAddressForm}
                hideTitle={true}
              />
            </div>

            {/* Bottom Form Context Submission Rails */}
            <div className="p-5 border-t border-gray-100 shrink-0 flex justify-end bg-stone-50/40 w-full">
              <button
                type="button"
                onClick={handleSave}
                disabled={isButtonDisabled}
                className="w-full sm:w-auto h-11 px-8 bg-black hover:bg-stone-900 text-white rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-none outline-none active:scale-[0.99]"
              >
                {isSaving ? 'Saving Hub Entry...' : editingId ? 'Save Address Changes' : 'Confirm New Address Hub'}
              </button>
            </div>
  
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}