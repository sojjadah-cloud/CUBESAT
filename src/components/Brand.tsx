/** Original MTC CubeSat mark: a 1U cube on an inclined orbit. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="10" fill="#0D2040" stroke="#294365" strokeWidth="1.5" />
      <ellipse cx="20" cy="21" rx="15.5" ry="6" transform="rotate(-20 20 21)" fill="none" stroke="#C9D4E2" strokeOpacity=".55" strokeWidth="1.2" />
      <path d="M20 10.5 27 14.5 20 18.5 13 14.5Z" fill="#2B4E7E" />
      <path d="M13 14.5 20 18.5V27L13 23Z" fill="#1A3459" />
      <path d="M27 14.5 20 18.5V27L27 23Z" fill="#142A4B" />
      <path d="M20 10.5 27 14.5V23L20 27 13 23V14.5Z" fill="none" stroke="#AFC2D8" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="33.6" cy="15.4" r="2.2" fill="#FFAA18" />
    </svg>
  );
}
