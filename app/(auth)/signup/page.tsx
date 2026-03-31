'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: `${location.origin}/subscribe`,
      },
    })
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-ink/10 p-8 text-center">
          <div className="w-16 h-16 bg-sage-light rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <h2 className="font-serif text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-slate text-sm">We sent a confirmation link to your inbox. Click it to verify your account and continue to subscription setup.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-ink/10 p-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Join FairwayGives</h1>
        <p className="text-slate text-sm mb-6">Create your account in seconds</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Full name" placeholder="Alex Johnson" {...register('fullName')} error={errors.fullName?.message} />
          <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" placeholder="Min. 8 characters" {...register('password')} error={errors.password?.message} />
          <Input label="Confirm password" type="password" placeholder="••••••••" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
          <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-slate mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-sage font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
