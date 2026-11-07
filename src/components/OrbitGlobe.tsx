"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoCircle, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import landTopo from "world-atlas/land-110m.json";

const W = 480;
const H = 440;
const CX = 240;
const CY = 222;
const R = 118; // Earth radius on screen
const ORBIT_R = 178;
const ORBIT_FLATTEN = 0.27; // how edge-on the orbit plane looks
const ORBIT_TILT = (-16 * Math.PI) / 180;
const AXIAL_TILT = -20; // degrees, applied to the globe's rotation
const EARTH_PERIOD = 60_000; // ms per full turn
const ORBIT_PERIOD = 16_000;

const topo = landTopo as unknown as Topology;
const LAND = feature(topo, topo.objects.land) as unknown as FeatureCollection<Geometry>;
const GRATICULE = geoGraticule10();
const ICE: Feature[] = [
  { type: "Feature", properties: {}, geometry: geoCircle().center([0, 90]).radius(9)() },
  { type: "Feature", properties: {}, geometry: geoCircle().center([0, -90]).radius(14)() },
];

// Deterministic pseudo-random so server and client render the same stars and clouds.
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const rnd = seeded(7);
const STARS = Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * H, r: 0.4 + rnd() * 1.1, o: 0.35 + rnd() * 0.6, tw: rnd() < 0.3 }));
// Cloud systems: short streaks of small puffs, mostly along the storm belts (~±10° and ~±50°).
const BELTS = [-52, -12, 8, 48, 60, -40, 25];
const CLOUDS: Feature[] = Array.from({ length: 22 }).flatMap((_, i) => {
  const lon = rnd() * 360 - 180;
  const lat = BELTS[i % BELTS.length] + (rnd() - 0.5) * 16;
  const puffs = 3 + Math.floor(rnd() * 4);
  return Array.from({ length: puffs }, (_, j) => ({
    type: "Feature" as const,
    properties: {},
    geometry: geoCircle()
      .center([lon + j * (3 + rnd() * 3), lat + (rnd() - 0.5) * 3])
      .radius(1.6 + rnd() * 3.2)(),
  }));
});

/** Satellite position on an inclined circular orbit; z > 0 is in front of the globe. */
function orbitPoint(t: number) {
  const x0 = ORBIT_R * Math.cos(t);
  const y0 = ORBIT_R * Math.sin(t) * ORBIT_FLATTEN;
  const z = ORBIT_R * Math.sin(t);
  const x = x0 * Math.cos(ORBIT_TILT) - y0 * Math.sin(ORBIT_TILT);
  const y = x0 * Math.sin(ORBIT_TILT) + y0 * Math.cos(ORBIT_TILT);
  return { x: CX + x, y: CY + y, z };
}

function orbitPaths() {
  const front: string[] = [];
  const back: string[] = [];
  const steps = 180;
  for (let i = 0; i < steps; i++) {
    const a = orbitPoint((i / steps) * Math.PI * 2);
    const b = orbitPoint(((i + 1) / steps) * Math.PI * 2);
    (a.z >= 0 ? front : back).push(`M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  return { front: front.join(""), back: back.join("") };
}
const ORBIT = orbitPaths();

function satTransform(t: number) {
  const p = orbitPoint(t);
  const ahead = orbitPoint(t + 0.01);
  const angle = (Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180) / Math.PI;
  const scale = 0.9 + (p.z / ORBIT_R) * 0.18; // slightly larger when closer
  return { front: p.z >= 0, transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${scale.toFixed(3)})` };
}

const SAT_START = 0.6;
const EARTH_FPS = 15;

function Satellite() {
  const cells = (ox: number) =>
    [0, 1, 2, 3].map((c) => [0, 1].map((r) => <rect key={`${ox}${c}${r}`} x={ox + 1 + c * 6} y={-5 + r * 5} width="5.2" height="4.2" fill="#1F4E8C" />));
  return (
    <g>
      {/* panels */}
      <rect x="-35" y="-6" width="25.5" height="12" rx="1" fill="#0E2B55" stroke="#B8C6D8" strokeWidth=".7" />
      {cells(-35)}
      <rect x="9.5" y="-6" width="25.5" height="12" rx="1" fill="#0E2B55" stroke="#B8C6D8" strokeWidth=".7" />
      {cells(9.5)}
      <path d="M-9.5 0h-0.5M9.5 0h0.5" stroke="#B8C6D8" strokeWidth="1.4" />
      {/* body with gold foil */}
      <rect x="-8" y="-8" width="16" height="16" rx="1.5" fill="url(#foil)" stroke="#7A5A16" strokeWidth=".6" />
      <path d="M-8 -3h16M-8 3h16" stroke="#8C6A1E" strokeWidth=".5" opacity=".6" />
      <rect x="-3.5" y="-3.5" width="7" height="7" rx="1" fill="#1A2B44" stroke="#C9D4E2" strokeWidth=".5" />
      <circle cx="0" cy="0" r="1.6" fill="#7CC4FF" />
      {/* antenna */}
      <path d="M0 -8v-7" stroke="#D9E1EB" strokeWidth=".8" />
      <circle cx="0" cy="-15.5" r="1.3" fill="#FFAA18" />
    </g>
  );
}

/** A turning Earth with real coastlines, clouds and a CubeSat in orbit; static when reduced motion is preferred. */
export function OrbitGlobe({ title, className = "" }: { title: string; className?: string }) {
  const [now, setNow] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const backSat = useRef<SVGGElement>(null);
  const frontSat = useRef<SVGGElement>(null);

  // The satellite moves every frame by updating its transform directly (no React render);
  // the Earth re-renders at a steady, lower rate because redrawing coastlines and clouds is heavier.
  useEffect(() => {
    if (still) return;
    let raf = 0;
    let lastEarth = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start;
      const { front, transform } = satTransform(SAT_START + (elapsed / ORBIT_PERIOD) * Math.PI * 2);
      for (const [el, show] of [[backSat.current, !front], [frontSat.current, front]] as const) {
        if (!el) continue;
        el.setAttribute("transform", transform);
        el.style.display = show ? "" : "none";
      }
      if (elapsed - lastEarth > 1000 / EARTH_FPS) {
        lastEarth = elapsed;
        setNow(elapsed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  const lon = -40 + (now / EARTH_PERIOD) * 360;
  const { land, clouds, ice, grid } = useMemo(() => {
    const projection = geoOrthographic().translate([CX, CY]).scale(R).clipAngle(90).rotate([lon, AXIAL_TILT]);
    const cloudProjection = geoOrthographic().translate([CX, CY]).scale(R + 1.5).clipAngle(90).rotate([lon * 1.25 + 30, AXIAL_TILT]);
    const p = geoPath(projection);
    const pc = geoPath(cloudProjection);
    return {
      land: p(LAND) ?? "",
      ice: ICE.map((f) => p(f) ?? "").join(""),
      grid: p(GRATICULE) ?? "",
      clouds: CLOUDS.map((f) => pc(f) ?? "").join(""),
    };
  }, [lon]);

  const initial = satTransform(SAT_START);

  // Separate stacked SVG layers, so the moving satellite and twinkling stars
  // don't force the blurred clouds and globe to repaint every frame.
  const layer = "absolute inset-0 h-full w-full";
  const vb = `0 0 ${W} ${H}`;
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-label={title}>
    <svg viewBox={vb} className={layer} aria-hidden="true">
      <defs>
        <radialGradient id="space" cx="20%" cy="15%" r="95%">
          <stop offset="0" stopColor="#13284A" />
          <stop offset=".55" stopColor="#081631" />
          <stop offset="1" stopColor="#040B1C" />
        </radialGradient>
        <radialGradient id="sun" cx="0%" cy="0%" r="60%">
          <stop offset="0" stopColor="#FFE7B0" stopOpacity=".35" />
          <stop offset="1" stopColor="#FFE7B0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ocean" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#3E8EDB" />
          <stop offset=".45" stopColor="#1D5FA8" />
          <stop offset=".85" stopColor="#0D3470" />
          <stop offset="1" stopColor="#082452" />
        </radialGradient>
        {/* Latitude banding: forests near poles and equator, drier subtropics */}
        <linearGradient id="landTone" x1="0" y1={CY - R} x2="0" y2={CY + R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5C7F52" />
          <stop offset=".25" stopColor="#6F9256" />
          <stop offset=".38" stopColor="#B9A06A" />
          <stop offset=".5" stopColor="#4F8B45" />
          <stop offset=".62" stopColor="#A9935F" />
          <stop offset=".78" stopColor="#6C8C55" />
          <stop offset="1" stopColor="#5C7F52" />
        </linearGradient>
        <radialGradient id="night" cx="30%" cy="26%" r="92%">
          <stop offset=".42" stopColor="#020617" stopOpacity="0" />
          <stop offset=".78" stopColor="#020617" stopOpacity=".55" />
          <stop offset="1" stopColor="#020617" stopOpacity=".88" />
        </radialGradient>
        <radialGradient id="shine" cx="32%" cy="26%" r="30%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".32" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
          <stop offset={R / (R + 22)} stopColor="#8FD0FF" stopOpacity=".55" />
          <stop offset={(R + 6) / (R + 22)} stopColor="#5AAEF5" stopOpacity=".22" />
          <stop offset="1" stopColor="#5AAEF5" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4D47A" />
          <stop offset=".5" stopColor="#C99A2E" />
          <stop offset="1" stopColor="#8E6A1C" />
        </linearGradient>
        <filter id="iceBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="cloudBlur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <clipPath id="globe">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      {/* Space */}
      <rect width={W} height={H} fill="url(#space)" />
      <rect width={W} height={H} fill="url(#sun)" />
      <g fill="#F7F9FC">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} opacity={s.o.toFixed(2)} className={s.tw ? "animate-twinkle" : undefined} style={s.tw ? { animationDelay: `${(i % 7) * 0.6}s` } : undefined} />
        ))}
      </g>
    </svg>

    {/* Orbit behind the globe, and the satellite when it is behind */}
    <svg viewBox={vb} className={layer} aria-hidden="true">
      <path d={ORBIT.back} fill="none" stroke="#C9D4E2" strokeOpacity=".22" strokeWidth="1.1" strokeDasharray="2 5" />
      <g ref={backSat} transform={initial.transform} style={{ display: initial.front ? "none" : undefined }}>
        <Satellite />
      </g>
    </svg>

    {/* Earth */}
    <svg viewBox={vb} className={layer} aria-hidden="true">
      <circle cx={CX} cy={CY} r={R + 22} fill="url(#atmo)" />
      <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" />
      <g clipPath="url(#globe)">
        <path d={grid} fill="none" stroke="#9FD3FF" strokeOpacity=".08" strokeWidth=".6" />
        <path d={land} fill="url(#landTone)" stroke="#9DBF86" strokeOpacity=".35" strokeWidth=".5" />
        <path d={ice} fill="#EEF4FA" opacity=".7" filter="url(#iceBlur)" />
        <path d={clouds} fill="#FFFFFF" opacity=".5" filter="url(#cloudBlur)" />
        <circle cx={CX} cy={CY} r={R} fill="url(#night)" />
        <circle cx={CX} cy={CY} r={R} fill="url(#shine)" />
      </g>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#A8DBFF" strokeOpacity=".55" strokeWidth="1.2" />
    </svg>

    {/* Orbit in front of the globe, and the satellite when it is in front */}
    <svg viewBox={vb} className={layer} aria-hidden="true">
      <path d={ORBIT.front} fill="none" stroke="#DCE6F2" strokeOpacity=".55" strokeWidth="1.3" />
      <g ref={frontSat} transform={initial.transform} style={{ display: initial.front ? undefined : "none" }}>
        <Satellite />
      </g>
    </svg>
    </div>
  );
}
