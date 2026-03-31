import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-serif text-8xl font-bold text-sage-light mb-4">404</p>
        <h1 className="font-serif text-3xl font-bold mb-2">Page not found</h1>
        <p className="text-slate mb-6">This page has gone out of bounds — much like a shanked 7-iron.</p>
        <Link href="/" className="bg-ink text-white font-medium px-6 py-3 rounded-full hover:bg-sage transition-colors inline-block">
          Back to home
        </Link>
      </div>
    </div>
  )
}
