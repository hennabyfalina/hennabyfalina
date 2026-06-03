'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCard from '@/components/admin/StatsCard'
import CustomerModal from '@/components/admin/CustomerModal'
import { Users, UserPlus, UserCheck, Search, Filter, Edit } from 'lucide-react'
import { formatCurrency, formatCompactIndianCurrency } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { CUSTOMER_SORT_OPTIONS } from '@/lib/constants'
import AdminCustomersLoading from './loading'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined)

  const supabase = createClient()

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*, addresses(*)')
        .eq('role', 'customer')

      if (error) throw error
      if (!users) { setCustomers([]); return }

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

  useEffect(() => {
    loadCustomers()
  }, [])

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

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const newCustomers = customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
  const activeCustomers = customers.filter(c => c.total_orders > 0).length

// Show loader if we're still loading and have no customers yet (initial load)
if (isLoading && customers.length === 0) {
  return <AdminCustomersLoading />;
}

  return (
    <>
      <div className="flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-medium admin-text-primary tracking-tight leading-tight">Customers</h1>
            <p className="text-sm admin-text-secondary mt-1">Manage accounts, shipping details, and order history.</p>
          </div>
          <button
            onClick={() => { setSelectedCustomer(undefined); setIsModalOpen(true); }}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-full cursor-pointer admin-action-button"
          >
            + Add Customer
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Total Accounts" value={customers.length} icon={<Users className="w-5 h-5" />} />
          <StatsCard title="New This Month" value={newCustomers} icon={<UserPlus className="w-5 h-5 text-green-400" />} />
          <StatsCard title="Active Buyers" value={activeCustomers} icon={<UserCheck className="w-5 h-5 admin-text-accent" />} />
        </div>

        <div className="flex flex-col md:flex-row gap-3 admin-bg-card p-3 rounded-[24px] border admin-border">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted group-focus-within:admin-text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 admin-bg-primary border border-transparent admin-text-primary placeholder:admin-text-muted rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 admin-text-muted hover:admin-text-primary">✕</button>}
          </div>
          
          <div className="relative shrink-0 min-w-[180px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted" />
            <select
              title="Sort customers"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 pl-10 pr-8 appearance-none admin-bg-primary border border-transparent admin-text-primary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#A8C7FA] transition-shadow cursor-pointer"
            >
              {CUSTOMER_SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="admin-bg-card">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-bg-card rounded-[32px] border admin-border overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[800px] text-left">
              <thead className="admin-bg-primary">
                <tr>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Client Identity</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Joined On</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest">Total Orders</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest text-right">LTV (Spent)</th>
                  <th className="px-6 py-5 text-xs font-bold admin-text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y admin-border">
                {sortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Users className="w-12 h-12 admin-text-muted mx-auto mb-4" />
                      <p className="admin-text-muted font-medium">No customers found.</p>
                    </td>
                  </tr>
                ) : (
                  sortedCustomers.map((customer) => (
                    <tr key={customer.id} onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }} className="hover:admin-bg-elevated transition-colors cursor-pointer group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full admin-bg-primary border admin-border flex items-center justify-center admin-text-accent font-bold text-sm">
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium admin-text-primary group-hover:admin-text-accent transition-colors">{customer.name || 'Unnamed User'}</p>
                            <p className="text-xs admin-text-muted mt-0.5">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm admin-text-secondary font-mono">{customer.phone || '—'}</td>
                      <td className="px-6 py-5 text-sm admin-text-secondary">{new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${customer.total_orders > 0 ? 'bg-[#214332]/30 text-[#93D7A4] border border-[#214332]' : 'admin-bg-elevated admin-text-muted border admin-border'}`}>
                          {customer.total_orders} ORDERS
                        </span>
                       </td>
                      <td className="px-6 py-5 text-right font-medium admin-text-primary">
                        {customer.total_spent > 0 ? formatCompactIndianCurrency(customer.total_spent) : '—'}
                      </td>
                      <td className="px-6 py-5 text-right">
                         <button className="p-2 admin-text-accent hover:bg-[#0B57D0]/20 rounded-full transition-colors cursor-pointer">
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