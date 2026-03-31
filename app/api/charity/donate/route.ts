import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { charityId, amount } = await req.json()
    if (!charityId || !amount || amount < 1) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const { data: charity } = await supabase.from('charities').select('name').eq('id', charityId).single()
    if (!charity) return NextResponse.json({ error: 'Charity not found' }, { status: 404 })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `Donation to ${charity.name}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/charity?donated=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/charity`,
      metadata: { user_id: user.id, charity_id: charityId, type: 'independent', amount: String(amount) },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
