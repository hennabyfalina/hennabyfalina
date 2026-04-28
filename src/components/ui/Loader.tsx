// src/components/ui/Loader.tsx

export default function Loader() {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-[#007185] rounded-full shadow-sm" />
    </div>
  )
}