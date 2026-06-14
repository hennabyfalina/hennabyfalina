// src/app/(shop)/profile/loading.tsx

import Container from '@/components/ui/Container'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-white py-8 md:py-14 animate-pulse select-none text-left">
      <Container className="max-w-[1000px] px-4 sm:px-8">
        
        {/* Page Title Heading Placeholder */}
        <div className="h-8 w-52 bg-stone-100 rounded-lg mb-8" />

        {/* 🚀 FIXED: Rebuilt layout matrix to match the Apple-inspired 2xl borderless card links perfectly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
            <div 
              key={item} 
              className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl"
            >
              {/* Floating Monochromatic Icon Container Placeholder */}
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-gray-50 flex items-center justify-center shrink-0">
                <div className="w-5 h-5 bg-stone-100 rounded-md" />
              </div>
              
              {/* Capitalized Text Structure Alignment Placeholders */}
              <div className="flex-1 space-y-2.5 pt-0.5">
                <div className="h-4.5 w-32 bg-stone-100 rounded-md" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-stone-100 rounded-md" />
                  <div className="h-3.5 w-4/5 bg-stone-100 rounded-md" />
                </div>
              </div>
              
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}