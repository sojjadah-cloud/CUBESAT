"use client";

import { useEffect, useState } from "react";

const CX = 240;
const CY = 220;
const R = 112; // Earth radius
const RX = 196; // orbit radii
const RY = 58;
const TILT = -16;

// Ellipse as a path, starting on the left and passing in front of the globe first.
const ORBIT = `M ${CX - RX} ${CY} a ${RX} ${RY} 0 1 0 ${2 * RX} 0 a ${RX} ${RY} 0 1 0 ${-2 * RX} 0`;
const PERIOD = "14s";

function Satellite() {
  return (
    <g>
      <rect x="-21" y="-4" width="13" height="8" rx="1" fill="#2F6FB3" stroke="#C9D4E2" strokeWidth=".8" />
      <rect x="8" y="-4" width="13" height="8" rx="1" fill="#2F6FB3" stroke="#C9D4E2" strokeWidth=".8" />
      <path d="M-8 0h-1M8 0h1" stroke="#C9D4E2" strokeWidth="1.2" />
      <rect x="-6" y="-6" width="12" height="12" rx="1.5" fill="#D9E1EB" stroke="#7F95B2" strokeWidth=".8" />
      <circle cx="0" cy="0" r="1.8" fill="#FFAA18" />
    </g>
  );
}

/** A slowly turning Earth with a CubeSat on an inclined orbit; static when reduced motion is preferred. */
export function OrbitGlobe({ title, className = "" }: { title: string; className?: string }) {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(mq.matches);
    const on = () => setStill(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const moving = (
    <animateMotion dur={PERIOD} repeatCount="indefinite" path={ORBIT} />
  );
  const sat = (
    <g transform={still ? `translate(${CX} ${CY + RY})` : undefined}>
      {!still && moving}
      <Satellite />
    </g>
  );

  // Land shapes, drawn twice side by side so they can scroll seamlessly across the globe.
  const land = (dx: number) => (
    <g transform={`translate(${dx} 0)`} fill="#3E9A6B" opacity=".9">
      <path d="M150 150c18-14 44-12 56 4 10 14-2 30 8 44 8 12-6 26-22 22-14-4-20-18-34-20-16-2-26-14-20-28 2-8 6-16 12-22z" />
      <path d="M232 230c14-6 30 0 34 14 4 16-8 26-6 42 2 14-12 22-24 14-12-8-8-24-16-34-8-10-2-30 12-36z" />
      <path d="M286 140c22-10 52-4 62 14 8 14-6 22-2 36 4 12-12 20-26 14-12-6-16-20-30-24-14-4-20-18-12-28 2-4 4-8 8-12z" />
      <path d="M310 236c10-4 22 2 22 12s-10 14-20 12-14-20-2-24z" />
      <path d="M176 262c10-6 24-2 26 8 2 12-10 20-22 16-10-4-12-18-4-24z" />
    </g>
  );

  return (
    <svg viewBox="0 0 480 440" className={className} role="img" aria-label={title}>
      <defs>
        <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#3D8FD9" />
          <stop offset=".6" stopColor="#1C5A9E" />
          <stop offset="1" stopColor="#0E2F5C" />
        </radialGradient>
        <radialGradient id="shade" cx="30%" cy="28%" r="80%">
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".45" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset=".78" stopColor="#7CC4FF" stopOpacity=".35" />
          <stop offset="1" stopColor="#7CC4FF" stopOpacity="0" />
        </radialGradient>
        <clipPath id="earth-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <clipPath id="front-half" clipPathUnits="userSpaceOnUse">
          <rect x="0" y={CY} width="480" height="240" />
        </clipPath>
      </defs>

      {/* Stars */}
      <g fill="#F7F9FC">
        {[
          [40, 50, 1.2], [96, 120, 0.8], [412, 70, 1.4], [440, 180, 0.9], [60, 330, 1], [380, 380, 0.8],
          [300, 40, 0.9], [150, 400, 1.1], [24, 210, 0.7], [460, 300, 1.2],
        ].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity=".7" />
        ))}
      </g>

      <g transform={`rotate(${TILT} ${CX} ${CY})`}>
        {/* Back half of the orbit and the satellite while behind the globe */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#C9D4E2" strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="3 6" />
        {sat}
      </g>

      {/* Earth */}
      <circle cx={CX} cy={CY} r={R + 14} fill="url(#glow)" />
      <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" />
      <g clipPath="url(#earth-clip)">
        <g>
          {!still && <animateTransform attributeName="transform" type="translate" from="0 0" to="-240 0" dur="40s" repeatCount="indefinite" />}
          {land(0)}
          {land(240)}
        </g>
        <circle cx={CX} cy={CY} r={R} fill="url(#shade)" />
      </g>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#9FD3FF" strokeOpacity=".5" strokeWidth="1.5" />

      <g transform={`rotate(${TILT} ${CX} ${CY})`}>
        {/* Front half of the orbit and the satellite while in front of the globe */}
        <g clipPath="url(#front-half)">
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#C9D4E2" strokeOpacity=".7" strokeWidth="1.4" />
          {sat}
        </g>
      </g>
    </svg>
  );
}
