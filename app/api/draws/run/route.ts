import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runDrawEngine } from '@/lib/draw-engine'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { mode, carryForward } = await req.json()
    const admin = createAdminClient()

    const currentMonth = new Date().toISOString().slice(0, 7)

    // Guard: prevent duplicate publish for same month
    const { data: existing } = await admin
      .from('draws')
      .select('id')
      .eq('draw_month', currentMonth)
      .eq('status', 'published')
      .single()

    if (existing) return NextResponse.json({ error: `Draw already published for ${currentMonth}` }, { status: 409 })

    const result = await runDrawEngine({ mode: mode ?? 'random', simulate: false, carryForward: carryForward ?? 0 })

    const tiers = result.tiers
    const fiveWinners = result.winners.filter(w => w.matchedCount === 5)

    // Persist draw record
    const { data: draw, error: drawErr } = await admin.from('draws').insert({
      draw_month: currentMonth,
      draw_date: new Date().toISOString().split('T')[0],
      drawn_numbers: result.drawnNumbers,
      mode: mode ?? 'random',
      status: 'published',
      prize_pool_total: result.prizePoolTotal,
      jackpot_carry_forward: result.newCarryForward,
      five_match_pool: tiers.five,
      four_match_pool: tiers.four,
      three_match_pool: tiers.three,
    }).select().single()

    if (drawErr) throw new Error(drawErr.message)

    // Persist winner results
    if (result.winners.length > 0) {
      await admin.from('draw_results').insert(
        result.winners.map(w => ({
          draw_id: draw.id,
          user_id: w.userId,
          matched_count: w.matchedCount,
          prize_amount: w.prizeAmount,
          payment_status: 'pending',
          verification_status: 'pending',
        }))
      )
    }

    return NextResponse.json({ ...result, drawId: draw.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
