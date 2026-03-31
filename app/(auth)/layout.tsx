import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist flex flex-col">
      <div className="p-6">
        <Link href="/" className="font-serif font-bold text-xl tracking-tight">
          Fairway<span className="text-sage">Gives</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        {children}
      </div>
    </div>
  )
}
