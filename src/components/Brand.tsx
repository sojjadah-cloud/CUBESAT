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

export function CubeSatIllustration({
  className = "",
  labels,
}: {
  className?: string;
  labels: { title: string; unit: string; label: string };
}) {
  const cell = (key: string, transform: string) => (
    <g key={key} transform={transform}>
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="#AFC2D8" strokeOpacity=".7" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      {[0, 1].map((c) =>
        [0, 1, 2].map((r) => (
          <rect
            key={`${c}${r}`}
            x={10 + c * 41}
            y={8 + r * 29}
            width="39"
            height="26"
            fill="#0B1B36"
            stroke="#C9D4E2"
            strokeOpacity=".45"
            strokeWidth=".8"
            vectorEffect="non-scaling-stroke"
          />
        )),
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 480 440" className={className} role="img" aria-labelledby="cubesat-title">
      <title id="cubesat-title">{labels.title}</title>
      <defs>
        <radialGradient id="earth" cx="50%" cy="0%" r="75%">
          <stop offset="0" stopColor="#16345C" />
          <stop offset=".55" stopColor="#0C1F3D" />
          <stop offset="1" stopColor="#071326" />
        </radialGradient>
        <linearGradient id="limb" x1="0" x2="1">
          <stop offset="0" stopColor="#C9D4E2" stopOpacity="0" />
          <stop offset=".5" stopColor="#C9D4E2" stopOpacity=".7" />
          <stop offset="1" stopColor="#C9D4E2" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Earth limb */}
      <circle cx="240" cy="940" r="560" fill="url(#earth)" />
      <path d="M-20 405 Q240 352 500 405" fill="none" stroke="url(#limb)" strokeWidth="1.5" />

      {/* Orbits */}
      <ellipse cx="240" cy="214" rx="222" ry="74" transform="rotate(-14 240 214)" fill="none" stroke="#294365" strokeWidth="1" />
      <ellipse cx="240" cy="214" rx="200" ry="62" transform="rotate(-14 240 214)" fill="none" stroke="#C9D4E2" strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 7" />
      <circle cx="447" cy="160" r="5" fill="#FFAA18" />
      <circle cx="447" cy="160" r="11" fill="none" stroke="#FFAA18" strokeOpacity=".35" />

      <g className="motion-safe:animate-[float_7s_ease-in-out_infinite]">
        {/* Antennas */}
        <path d="M171 162 92 118M309 162 404 126" stroke="#AFC2D8" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M240 312 240 352" stroke="#AFC2D8" strokeWidth="1.4" strokeLinecap="round" />

        {/* Body */}
        <path d="M240 122 309 162 240 202 171 162Z" fill="#2B4E7E" />
        <path d="M171 162 240 202V312L171 272Z" fill="#1A3459" />
        <path d="M309 162 240 202V312L309 272Z" fill="#142A4B" />
        {cell("left", "matrix(.69 .4 0 1.1 171 162)")}
        {cell("right", "matrix(.69 -.4 0 1.1 240 202)")}
        <g transform="matrix(.69 -.4 .69 .4 171 162)">
          <rect x="22" y="22" width="56" height="56" fill="none" stroke="#AFC2D8" strokeOpacity=".6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <circle cx="50" cy="50" r="12" fill="#0B1B36" stroke="#C9D4E2" strokeOpacity=".6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </g>
        <path d="M240 122 309 162V272L240 312 171 272V162Z M171 162 240 202 309 162 M240 202V312" fill="none" stroke="#C8D6E6" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="303" cy="170" r="2.6" fill="#E83B3B" />
      </g>

    </svg>
  );
}
