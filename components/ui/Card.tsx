import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: 'sage' | 'gold' | 'none'
}

export default function Card({ children, className, accent = 'none' }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-ink/10 p-6 relative overflow-hidden',
        accent === 'sage' && 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sage',
        accent === 'gold' && 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gold',
        className
      )}
    >
      {children}
    </div>
  )
}
