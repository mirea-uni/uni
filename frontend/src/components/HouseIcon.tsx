function HouseIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinejoin="round" />
      <path d="M10 21v-6h4v6" strokeLinejoin="round" />
    </svg>
  )
}

export default HouseIcon
