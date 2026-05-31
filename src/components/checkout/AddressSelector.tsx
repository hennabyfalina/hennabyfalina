// src/components/checkout/AddressSelector.tsx

'use client'

import { Pencil, Check, Store } from 'lucide-react'

interface AddressSelectorProps {
  savedAddresses: any[]
  selectedAddressId: string | null
  onSelect: (address: any) => void
  onEdit: (address: any) => void
  onAddNew: () => void
  showPickup?: boolean
}

export default function AddressSelector({
  savedAddresses,
  selectedAddressId,
  onSelect,
  onEdit,
  onAddNew,
  showPickup = false
}: AddressSelectorProps) {
  // Filter real delivery addresses (exclude temporary ones unless actively selected)
  const deliveryAddresses = savedAddresses.filter(a => 
    a.delivery_method === 'delivery' && 
    a.id !== null && 
    (!a.is_temp || a.id === selectedAddressId)
  )
  
  // Find real pickup address (exclude temporary unless actively selected)
  const pickupAddress = savedAddresses.find(a => 
    a.delivery_method === 'pickup' && 
    a.id !== null && 
    (!a.is_temp || a.id === selectedAddressId)
  )

  // For pickup-only mode (when showPickup is true)
  if (showPickup && pickupAddress) {
    return (
      <div className="space-y-3 animate-in fade-in">
        <p className="font-bold text-[#0F1111] text-lg">Pickup Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            onClick={() => onSelect(pickupAddress)}
            className={`p-4 border rounded-md cursor-pointer transition-all ${
              selectedAddressId === pickupAddress.id
                ? 'border-[#dfdcdc] bg-[#ffffff]'
                : 'border-[#D5D9D9] hover:border-gray-400 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0">
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                    selectedAddressId === pickupAddress.id ? 'bg-[#FF9900]' : 'bg-gray-100 border border-gray-300'
                  }`}
                >
                  {selectedAddressId === pickupAddress.id && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="flex-1 text-sm text-[#0F1111] leading-relaxed">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5 w-full">
                    <div>
                      <span className="font-bold text-gray-700">Name:</span>{' '}
                      <span className="text-gray-900">{pickupAddress.name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">Phone:</span>{' '}
                      <span className="text-gray-900">{pickupAddress.phone}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">Pincode:</span>{' '}
                      <span className="text-gray-900">{pickupAddress.pincode}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(pickupAddress) }} 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer shadow-sm shrink-0 ml-2"
                    title="Edit contact details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default: delivery addresses only
  return (
    <div className="space-y-3 animate-in fade-in">
      <p className="font-bold text-[#0F1111] text-lg">Delivery Address</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {deliveryAddresses.map((address) => {
          const isSelected = selectedAddressId === address.id
          
          return (
            <div 
              key={address.id}
              onClick={() => onSelect(address)}
              className={`p-4 border rounded-md cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#dfdcdc] bg-[#ffffff]'
                  : 'border-[#D5D9D9] hover:border-gray-400 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  <div 
                    className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                      isSelected ? 'bg-[#FF9900]' : 'bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div className="flex-1 text-sm text-[#0F1111] leading-relaxed">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 w-full">
                      {/* Name */}
                      <div>
                        <span className="font-bold text-gray-700">Name:</span>{' '}
                        <span className="text-gray-900">{address.name}</span>
                      </div>
                      
                      {/* Address Line 1 */}
                      {address.address_line1 && (
                        <div>
                          <span className="font-bold text-gray-700">Address:</span>{' '}
                          <span className="text-gray-900">{address.address_line1}</span>
                        </div>
                      )}
                      
                      {/* Address Line 2 (if exists) */}
                      {address.address_line2 && (
                        <div>
                          <span className="font-bold text-gray-700">Area/Street:</span>{' '}
                          <span className="text-gray-900">{address.address_line2}</span>
                        </div>
                      )}
                      
                      {/* City, State, Pincode */}
                      <div>
                        <span className="font-bold text-gray-700">City:</span>{' '}
                        <span className="text-gray-900">{address.city}</span>
                        {address.state && (
                          <span> <span className="font-bold text-gray-700">State:</span> {address.state}</span>
                        )}
                        {address.pincode && (
                          <span> <span className="font-bold text-gray-700">Pincode:</span> {address.pincode}</span>
                        )}
                      </div>
                      
                      {/* Landmark (if exists) */}
                      {address.landmark && (
                        <div>
                          <span className="font-bold text-gray-700">Landmark:</span>{' '}
                          <span className="text-gray-900">{address.landmark}</span>
                        </div>
                      )}
                      
                      {/* Delivery Instructions (if exists) */}
                      {address.delivery_instructions && (
                        <div>
                          <span className="font-bold text-gray-700">Instructions:</span>{' '}
                          <span className="text-gray-900 italic">{address.delivery_instructions}</span>
                        </div>
                      )}
                      
                      {/* Phone */}
                      <div>
                        <span className="font-bold text-gray-700">Phone:</span>{' '}
                        <span className="text-gray-900">{address.phone}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(address) }} 
                      className="flex items-center justify-center w-8 h-8 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer shadow-sm shrink-0 ml-2"
                      title="Edit address"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}