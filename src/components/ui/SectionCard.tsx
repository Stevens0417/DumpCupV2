type Props = {
  title?: string
  children: React.ReactNode
  className?: string
}

export default function SectionCard({ title, children, className = '' }: Props) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
