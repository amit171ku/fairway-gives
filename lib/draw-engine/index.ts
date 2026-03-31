import { createAdminClient } from '@/lib/supabase/server'

export type DrawMode = 'random' | 'weighted_frequent' | 'weighted_rare'

export interface DrawRunConfig {
  mode: DrawMode
  simulate: boolean
  carryForward?: number
}

export interface DrawRunResult {
  drawnNumbers: number[]
  prizePoolTotal: number
  tiers: { five: number; four: number; three: number }
  winners: WinnerResult[]
  newCarryForward: number
  simulated: boolean
}

export interface WinnerResult {
  userId: string
  email: string
  fullName: string
  matchedCount: 3 | 4 | 5
  prizeAmount: number
}

export async function runDrawEngine(config: DrawRunConfig): Promise<DrawRunResult> {
  const supabase = createAdminClient()

  // 1. Fetch all active subscribers with scores
  const { data: subscribers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      scores ( points, played_at ),
      subscriptions!inner ( status, amount )
    `)
    .eq('subscriptions.status', 'active')

  if (error) throw new Error(`DB error: ${error.message}`)
  if (!subscribers?.length) throw new Error('No active subscribers found')

  // 2. Calculate prize pool from active subscriber amounts
  const prizePoolTotal = subscribers.reduce((sum, s) => {
    const sub = (s.subscriptions as any)[0]
    return sum + Number(sub?.amount ?? 0)
  }, 0)

  const carry = config.carryForward ?? 0
  const tiers = {
    five: (prizePoolTotal * 0.40) + carry,
    four: prizePoolTotal * 0.35,
    three: prizePoolTotal * 0.25,
  }

  // 3. Generate draw numbers
  const drawnNumbers = generateDrawNumbers(subscribers, config.mode)

  // 4. Match users (only those with exactly 5 scores)
  const rawWinners = subscribers
    .filter(s => (s.scores as any[]).length === 5)
    .map(s => {
      const userNums = (s.scores as any[])
        .sort((a: any, b: any) =>
          new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
        )
        .map((sc: any) => sc.points)

      const matched = userNums.filter((n: number) => drawnNumbers.includes(n)).length
      return {
        userId: s.id,
        email: s.email,
        fullName: s.full_name ?? s.email,
        matched,
      }
    })
    .filter(w => w.matched >= 3)

  const fiveWinners  = rawWinners.filter(w => w.matched === 5)
  const fourWinners  = rawWinners.filter(w => w.matched === 4)
  const threeWinners = rawWinners.filter(w => w.matched === 3)

  const winners: WinnerResult[] = [
    ...fiveWinners.map(w => ({
      userId: w.userId,
      email: w.email,
      fullName: w.fullName,
      matchedCount: 5 as const,
      prizeAmount: fiveWinners.length > 0 ? tiers.five / fiveWinners.length : 0,
    })),
    ...fourWinners.map(w => ({
      userId: w.userId,
      email: w.email,
      fullName: w.fullName,
      matchedCount: 4 as const,
      prizeAmount: fourWinners.length > 0 ? tiers.four / fourWinners.length : 0,
    })),
    ...threeWinners.map(w => ({
      userId: w.userId,
      email: w.email,
      fullName: w.fullName,
      matchedCount: 3 as const,
      prizeAmount: threeWinners.length > 0 ? tiers.three / threeWinners.length : 0,
    })),
  ]

  const newCarryForward = fiveWinners.length === 0 ? tiers.five : 0

  return {
    drawnNumbers,
    prizePoolTotal,
    tiers,
    winners,
    newCarryForward,
    simulated: config.simulate,
  }
}

function generateDrawNumbers(subscribers: any[], mode: DrawMode): number[] {
  if (mode === 'random') {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1)
    // Fisher-Yates shuffle, take first 5
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, 5).sort((a, b) => a - b)
  }

  // Build frequency map
  const freq: Record<number, number> = {}
  subscribers.forEach(s => {
    ;(s.scores as any[]).forEach((sc: any) => {
      freq[sc.points] = (freq[sc.points] ?? 0) + 1
    })
  })

  const sorted = Object.entries(freq)
    .sort(([, a], [, b]) =>
      mode === 'weighted_frequent' ? Number(b) - Number(a) : Number(a) - Number(b)
    )
    .map(([n]) => parseInt(n))

  // Fill up to 5 with random if not enough unique scores
  const result = sorted.slice(0, 5)
  if (result.length < 5) {
    const remaining = Array.from({ length: 45 }, (_, i) => i + 1)
      .filter(n => !result.includes(n))
      .sort(() => Math.random() - 0.5)
    result.push(...remaining.slice(0, 5 - result.length))
  }

  return result.sort((a, b) => a - b)
}
