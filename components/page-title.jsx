export default function PageTitle({ title }) {
  return (
    <div className="w-full text-center py-4">
      <h1 className="text-4xl md:text-5xl font-script text-[#6b0000] italic">{title}</h1>
      <div className="w-full max-w-md mx-auto mt-2 flex items-center">
        <div className="flex-1 h-px bg-gray-300"></div>
        <div className="w-16 h-16 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#6b0000] mx-1"></div>
          <div className="w-3 h-3 rounded-full bg-[#6b0000] mx-1"></div>
          <div className="w-3 h-3 rounded-full bg-[#6b0000] mx-1"></div>
        </div>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>
    </div>
  )
}
