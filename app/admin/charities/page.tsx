'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  image_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  upcoming_event: z.string().optional(),
  event_date: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('created_at', { ascending: false })
    setCharities(data ?? [])
  }

  useEffect(() => { fetchCharities() }, [])

  const openEdit = (c: any) => {
    setEditing(c)
    setValue('name', c.name)
    setValue('description', c.description ?? '')
    setValue('image_url', c.image_url ?? '')
    setValue('website_url', c.website_url ?? '')
    setValue('upcoming_event', c.upcoming_event ?? '')
    setValue('event_date', c.event_date ?? '')
    setShowForm(true)
  }

  const onSubmit = async (data: FormData) => {
    if (editing) {
      await supabase.from('charities').update(data).eq('id', editing.id)
      setMessage('Charity updated')
    } else {
      await supabase.from('charities').insert({ ...data, total_raised: 0 })
      setMessage('Charity added')
    }
    reset()
    setEditing(null)
    setShowForm(false)
    fetchCharities()
    setTimeout(() => setMessage(''), 3000)
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_active: !current }).eq('id', id)
    fetchCharities()
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    // Remove existing featured first
    await supabase.from('charities').update({ is_featured: false }).eq('is_featured', true)
    await supabase.from('charities').update({ is_featured: !current }).eq('id', id)
    fetchCharities()
  }

  const deleteCharity = async (id: string) => {
    if (!confirm('Delete this charity? This cannot be undone.')) return
    await supabase.from('charities').delete().eq('id', id)
    fetchCharities()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">Charities</h1>
          <p className="text-slate text-sm mt-1">Manage charity listings and content</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditing(null); reset() }} variant="secondary" size="sm">
          <Plus size={14} /> Add charity
        </Button>
      </div>

      {message && (
        <div className="bg-sage-light text-sage font-medium text-sm px-4 py-3 rounded-xl mb-4">{message}</div>
      )}

      {showForm && (
        <Card className="mb-6">
          <h2 className="font-medium mb-4">{editing ? 'Edit charity' : 'Add new charity'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
            <Input label="Charity name" {...register('name')} error={errors.name?.message} />
            <Input label="Website URL" placeholder="https://..." {...register('website_url')} error={errors.website_url?.message} />
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-ink block mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Brief description of the charity..."
                className="w-full px-4 py-2.5 rounded-xl border border-ink/15 text-sm bg-white outline-none focus:ring-2 focus:ring-sage/30"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <Input label="Image URL" placeholder="https://..." {...register('image_url')} error={errors.image_url?.message} />
            <Input label="Upcoming event name" {...register('upcoming_event')} />
            <Input label="Event date" type="date" {...register('event_date')} />
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" loading={isSubmitting} variant="secondary" size="md">
                {editing ? 'Save changes' : 'Add charity'}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => { setShowForm(false); setEditing(null); reset() }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {charities.map(c => (
          <Card key={c.id} className={!c.is_active ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{c.name}</h3>
                  {c.is_featured && <span className="text-xs bg-gold-light text-gold px-2 py-0.5 rounded-full">Featured</span>}
                  {!c.is_active && <span className="text-xs bg-mist text-slate px-2 py-0.5 rounded-full border">Inactive</span>}
                </div>
                <p className="text-xs text-slate line-clamp-2">{c.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-sage font-medium">£{c.total_raised.toLocaleString()} raised</span>
              {c.upcoming_event && <span className="text-xs text-slate">{c.upcoming_event}</span>}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs border border-ink/15 px-3 py-1.5 rounded-full hover:border-ink text-slate">
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => toggleFeatured(c.id, c.is_featured)} className={`flex items-center gap-1 text-xs border px-3 py-1.5 rounded-full transition-colors ${c.is_featured ? 'border-gold text-gold' : 'border-ink/15 text-slate hover:border-gold hover:text-gold'}`}>
                <Star size={11} /> {c.is_featured ? 'Unfeature' : 'Feature'}
              </button>
              <button onClick={() => toggleActive(c.id, c.is_active)} className="flex items-center gap-1 text-xs border border-ink/15 px-3 py-1.5 rounded-full hover:border-ink text-slate">
                {c.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => deleteCharity(c.id)} className="flex items-center gap-1 text-xs border border-red-200 text-red-400 px-3 py-1.5 rounded-full hover:border-red-500 hover:text-red-600">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
