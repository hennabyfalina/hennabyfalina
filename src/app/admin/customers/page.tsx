// src/app/admin/customers/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/StatsCard'
import AdminLoader from '@/components/admin/AdminLoader'
import CustomerModal from '@/components/admin/CustomerModal'
import { Users, UserPlus, UserCheck, Search, Filter, Edit } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

// 🚨 DRY CONSTANTS 🚨
import { CUSTOMER_SORT_OPTIONS } from '@/lib/constants'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  total_orders: number
  total_spent: number
  addresses?: any[]
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined)

  const supabase = createClient()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*, addresses(*)')
        .eq('role', 'customer')

      if (error) throw error
      if (!users) { setCustomers([]); return }

      // Get order stats
      const customersWithStats = await Promise.all(
        users.map(async (user) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id)
            .eq('payment_status', 'paid')

          return {
            ...user,
            total_orders: orders?.length || 0,
            total_spent: orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
          }
        })
      )
      setCustomers(customersWithStats)
    } catch (err) {
      showToast('Failed to load customers', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter & Sort Logic
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  )

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortBy === 'spent_desc') return b.total_spent - a.total_spent
    if (sortBy === 'orders_desc') return b.total_orders - a.total_orders
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '')
    return 0
  })

  // Metrics
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const newCustomers = customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
  const activeCustomers = customers.filter(c => c.total_orders > 0).length

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdminLoader message="Fetching user database..." />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* 🚨 HEADER 🚨 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium text-[#E3E3E3] tracking-tight leading-tight">Customers</h1>
            <p className="text-sm text-[#C4C7C5] mt-1">Manage accounts, shipping details, and order history.</p>
          </div>
          <button
            onClick={() => { setSelectedCustomer(undefined); setIsModalOpen(true); }}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-[#0B57D0] text-white rounded-full hover:bg-[#0842A0] transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98] cursor-pointer"
          >
            + Add Customer
          </button>
        </div>

        {/* 🚨 STATS GRID 🚨 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Total Accounts" value={customers.length} icon={<Users className="w-5 h-5" />} />
          <StatsCard title="New This Month" value={newCustomers} icon={<UserPlus className="w-5 h-5 text-green-400" />} />
          <StatsCard title="Active Buyers" value={activeCustomers} icon={<UserCheck className="w-5 h-5 text-[#A8C7FA]" />} />
        </div>

        {/* 🚨 FLOATING SEARCH & FILTERS 🚨 */}
        <div className="flex flex-col md:flex-row gap-3 bg-[#1E1F20] p-3 rounded-[24px] border border-[#333538]">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196] group-focus-within:text-[#A8C7FA] transition-colors" />
            <input
              type="text"
              placeholder="Search name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-[#131314] border border-transparent text-[#E3E3E3] placeholder:text-[#8E9196] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E9196] hover:text-[#E3E3E3]">✕</button>}
          </div>
          
          <div className="relative shrink-0 min-w-[180px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9196]" />
            <select
              title="Sort customers"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-8 appearance-none bg-[#131314] border border-transparent text-[#E3E3E3] rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
            >
              {CUSTOMER_SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#1E1F20]">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 🚨 ELITE DATA TABLE 🚨 */}
        <div className="bg-[#1E1F20] rounded-[32px] border border-[#333538] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-[#131314]">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Client Identity</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Joined On</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest">Total Orders</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest text-right">LTV (Spent)</th>
                  <th className="px-6 py-5 text-xs font-bold text-[#8E9196] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333538]">
                {sortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Users className="w-12 h-12 text-[#333538] mx-auto mb-4" />
                      <p className="text-[#8E9196] font-medium">No customers found.</p>
                    </td>
                  </tr>
                ) : (
                  sortedCustomers.map((customer) => (
                    <tr key={customer.id} onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }} className="hover:bg-[#282A2C] transition-colors cursor-pointer group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#131314] border border-[#333538] flex items-center justify-center text-[#A8C7FA] font-bold text-sm">
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#E3E3E3] group-hover:text-[#A8C7FA] transition-colors">{customer.name || 'Unnamed User'}</p>
                            <p className="text-xs text-[#8E9196] mt-0.5">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#C4C7C5] font-mono">{customer.phone || '—'}</td>
                      <td className="px-6 py-5 text-sm text-[#C4C7C5]">{new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${customer.total_orders > 0 ? 'bg-[#214332]/30 text-[#93D7A4] border border-[#214332]' : 'bg-[#282A2C] text-[#8E9196] border border-[#333538]'}`}>
                          {customer.total_orders} ORDERS
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-medium text-[#E3E3E3]">
                        {customer.total_spent > 0 ? formatCurrency(customer.total_spent) : '—'}
                      </td>
                      <td className="px-6 py-5 text-right">
                         <button className="p-2 text-[#A8C7FA] hover:bg-[#0B57D0]/20 rounded-full transition-colors cursor-pointer">
                           <Edit className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={loadCustomers}
      />
    </>
  )
}