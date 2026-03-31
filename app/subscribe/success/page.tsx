import Link from 'next/link'

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-ink/10 p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-sage-light rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
        <h1 className="font-serif text-3xl font-bold mb-2">You're in!</h1>
        <p className="text-slate mb-6">Your subscription is active. Head to your dashboard to enter your scores and choose your charity.</p>
        <Link href="/dashboard" className="bg-sage text-white font-medium px-8 py-3 rounded-full inline-block hover:bg-sage-dark transition-colors">
          Go to Dashboard →
        </Link>
      </div>
    </div>
  )
}
