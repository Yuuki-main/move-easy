import Link from 'next/link'
import { cn } from '@/lib/utils'

const variants = {
  primary:
    'bg-zinc-900 hover:bg-black text-white shadow-sm',
  secondary:
    'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
  ghost:
    'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-sm rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium transition-colors duration-200',
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
