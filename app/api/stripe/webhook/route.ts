import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook error: ${e.message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan as 'monthly' | 'yearly'
      if (!userId) break

      const subId = session.subscription as string
      const stripeSub = await stripe.subscriptions.retrieve(subId)
      const amount = plan === 'monthly' ? 9.99 : 99.99

      await supabase.from('subscriptions').update({
        stripe_subscription_id: subId,
        stripe_customer_id: session.customer as string,
        plan,
        status: 'active',
        amount,
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      }).eq('user_id', userId)

      // Log initial charity contribution
      const { data: profile } = await supabase.from('profiles').select('charity_id, charity_pct').eq('id', userId).single()
      const { data: sub } = await supabase.from('subscriptions').select('id').eq('user_id', userId).single()
      if (profile?.charity_id && sub) {
        const contrib = amount * ((profile.charity_pct ?? 10) / 100)
        await supabase.from('charity_contributions').insert({
          user_id: userId,
          charity_id: profile.charity_id,
          subscription_id: sub.id,
          amount: contrib,
          type: 'subscription',
        })
        await supabase.from('charities').update({
          total_raised: supabase.rpc('increment', { row_id: profile.charity_id, amount: contrib }) as any,
        }).eq('id', profile.charity_id)
      }
      break
    }

    case 'customer.subscription.updated': {
      const stripeSub = event.data.object as Stripe.Subscription
      const status = stripeSub.status === 'active' ? 'active'
        : stripeSub.status === 'canceled' ? 'cancelled'
        : stripeSub.status === 'past_due' ? 'lapsed'
        : 'inactive'

      await supabase.from('subscriptions').update({
        status,
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      }).eq('stripe_subscription_id', stripeSub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions').update({ status: 'cancelled' })
        .eq('stripe_subscription_id', stripeSub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('subscriptions').update({ status: 'lapsed' })
        .eq('stripe_subscription_id', invoice.subscription as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
