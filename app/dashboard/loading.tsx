export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-8">
      <div className="h-8 bg-ink/10 rounded-xl w-1/3" />
      <div className="h-4 bg-ink/5 rounded-xl w-1/2" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-ink/5 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-48 bg-ink/5 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
