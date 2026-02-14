export default function Skeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-16 w-full"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}
