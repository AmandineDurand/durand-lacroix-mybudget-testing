export default function Skeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 rounded h-16 w-full" />
      ))}
    </div>
  )
}
