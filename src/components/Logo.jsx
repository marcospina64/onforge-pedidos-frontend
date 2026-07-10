export default function Logo({ variant = 'black', className = 'h-8' }) {
  const src = variant === 'cream' ? '/logo-cream.svg' : '/logo-black.svg'
  return <img src={src} alt="O.N forge" className={className} />
}
