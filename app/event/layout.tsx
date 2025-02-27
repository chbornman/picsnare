export default function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-4">
      {children}
    </div>
  )
}