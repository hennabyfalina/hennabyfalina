// src/components/admin/DashboardDateFilter.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const MONTHS = [
  { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
  { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
  { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
  { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
]

export default function DashboardDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentRange = searchParams?.get('range') || '30d'
  const start = searchParams?.get('start') || ''
  const end = searchParams?.get('end') || ''

  const [isCustomOpen, setIsCustomOpen] = useState(false)
  
  const [startDay, setStartDay] = useState('')
  const [startMonth, setStartMonth] = useState('01')
  const [startYear, setStartYear] = useState('')

  const [endDay, setEndDay] = useState('')
  const [endMonth, setEndMonth] = useState('01')
  const [endYear, setEndYear] = useState('')

  useEffect(() => {
    if (isCustomOpen) {
      if (start) {
        const [y, m, d] = start.split('-')
        setStartYear(y); setStartMonth(m); setStartDay(d)
      } else {
        const d = new Date()
        setStartYear(d.getFullYear().toString()); setStartMonth((d.getMonth() + 1).toString().padStart(2, '0')); setStartDay(d.getDate().toString().padStart(2, '0'))
      }
      
      if (end) {
        const [y, m, d] = end.split('-')
        setEndYear(y); setEndMonth(m); setEndDay(d)
      } else {
        const d = new Date()
        setEndYear(d.getFullYear().toString()); setEndMonth((d.getMonth() + 1).toString().padStart(2, '0')); setEndDay(d.getDate().toString().padStart(2, '0'))
      }
    }
  }, [isCustomOpen, start, end])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'custom') {
      setIsCustomOpen(true)
    } else {
      setIsCustomOpen(false)
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('range', val)
      params.delete('start')
      params.delete('end')
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }

  const applyCustomDate = () => {
    if (startDay && startYear && endDay && endYear) {
      const sDate = `${startYear}-${startMonth}-${startDay.padStart(2, '0')}`
      const eDate = `${endYear}-${endMonth}-${endDay.padStart(2, '0')}`

      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('range', 'custom')
      params.set('start', sDate)
      params.set('end', eDate)
      router.push(`?${params.toString()}`, { scroll: false })
      setIsCustomOpen(false)
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex items-center admin-bg-primary border admin-border hover:border-[#A8C7FA] rounded-full px-4 py-2 shadow-sm transition-colors cursor-pointer">
        <Calendar className="w-4 h-4 admin-text-muted mr-2 shrink-0 pointer-events-none" />
        <select 
          value={currentRange === 'custom' && !isCustomOpen ? 'custom' : currentRange}
          title="Select dashboard date range"
          onChange={handleChange}
          className="bg-transparent text-sm font-medium admin-text-primary focus:outline-none cursor-pointer appearance-none pr-6 z-10"
        >
          <option value="30d" className="admin-bg-card">Last 30 Days</option>
          <option value="3m" className="admin-bg-card">Last 3 Months</option>
          <option value="6m" className="admin-bg-card">Last 6 Months</option>
          <option value="1y" className="admin-bg-card">Last 1 Year</option>
          <option value="custom" className="admin-bg-card">Custom Range...</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none admin-text-muted">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {isCustomOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm admin-bg-card border admin-border rounded-[32px] shadow-2xl p-7 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold admin-text-primary">Custom Range</h4>
              <button onClick={() => setIsCustomOpen(false)} className="p-2 admin-bg-primary hover:admin-bg-elevated border admin-border rounded-full admin-text-primary transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold admin-text-muted uppercase tracking-widest">Start Date</label>
              <div className="flex gap-2">
                <input type="text" maxLength={2} placeholder="DD" value={startDay} onChange={e => setStartDay(e.target.value.replace(/\D/g, ''))} className="w-14 admin-bg-primary border admin-border admin-text-primary rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#A8C7FA] text-center" />
                <div className="relative flex-1">
                  <select value={startMonth} title="Start Month" onChange={e => setStartMonth(e.target.value)} className="w-full admin-bg-primary border admin-border admin-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#A8C7FA] appearance-none cursor-pointer">
                    {MONTHS.map(m => <option key={m.v} value={m.v} className="admin-bg-card">{m.l}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none admin-text-muted">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <input type="text" maxLength={4} placeholder="YYYY" value={startYear} onChange={e => setStartYear(e.target.value.replace(/\D/g, ''))} className="w-20 admin-bg-primary border admin-border admin-text-primary rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#A8C7FA] text-center" />
              </div>
            </div>
          
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold admin-text-muted uppercase tracking-widest">End Date</label>
              <div className="flex gap-2">
                <input type="text" maxLength={2} placeholder="DD" value={endDay} onChange={e => setEndDay(e.target.value.replace(/\D/g, ''))} className="w-14 admin-bg-primary border admin-border admin-text-primary rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#A8C7FA] text-center" />
                <div className="relative flex-1">
                  <select value={endMonth} title="End Month" onChange={e => setEndMonth(e.target.value)} className="w-full admin-bg-primary border admin-border admin-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#A8C7FA] appearance-none cursor-pointer">
                    {MONTHS.map(m => <option key={m.v} value={m.v} className="admin-bg-card">{m.l}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none admin-text-muted">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <input type="text" maxLength={4} placeholder="YYYY" value={endYear} onChange={e => setEndYear(e.target.value.replace(/\D/g, ''))} className="w-20 admin-bg-primary border admin-border admin-text-primary rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#A8C7FA] text-center" />
              </div>
            </div>
          
            <div className="flex gap-3 mt-4 pt-6 border-t admin-border">
              <button onClick={() => setIsCustomOpen(false)} className="flex-1 py-3 text-sm font-medium bg-transparent border admin-border admin-text-primary hover:admin-bg-elevated rounded-full transition-colors cursor-pointer">Cancel</button>
              <button onClick={applyCustomDate} className="flex-1 py-3 text-sm font-bold admin-btn-primary rounded-full shadow-lg shadow-blue-900/20">Apply Range</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}