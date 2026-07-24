'use client'

export default function WhatsAppCardButton({ productName }: { productName: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // WhatsApp redirect temporarily disabled
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Chat about ${productName} on WhatsApp`}
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:scale-110 hover:bg-[#1ebe5d] md:h-8 md:w-8"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="h-3 w-3 md:h-5 md:w-5" aria-hidden="true">
        <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.514L4 29l7.697-1.813A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22a9.94 9.94 0 0 1-5.059-1.378l-.363-.214-4.57 1.076 1.1-4.457-.237-.377A9.956 9.956 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.406-7.472c-.295-.148-1.745-.861-2.015-.959-.27-.098-.467-.148-.663.148-.196.295-.762.959-.934 1.156-.172.197-.344.222-.639.074-.295-.148-1.246-.459-2.373-1.463-.877-.782-1.469-1.748-1.641-2.043-.172-.295-.018-.454.129-.601.132-.132.295-.344.443-.516.148-.172.197-.295.295-.492.099-.197.05-.369-.025-.516-.074-.148-.663-1.599-.908-2.19-.239-.576-.482-.498-.663-.507l-.565-.01c-.197 0-.516.074-.787.369s-1.033 1.009-1.033 2.46 1.058 2.854 1.206 3.051c.148.197 2.083 3.181 5.047 4.462.706.305 1.256.487 1.685.623.708.226 1.353.194 1.862.118.568-.085 1.745-.714 1.991-1.404.246-.689.246-1.28.172-1.404-.074-.123-.271-.197-.566-.344z"/>
      </svg>
    </button>
  )
}
