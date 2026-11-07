import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light theme: gray-blue page, white surfaces, navy text.
        space: { 950: "#EEF2F7", 900: "#F7F9FC", 800: "#E3E9F1", 700: "#D3DCE7" },
        navy: "#0B1B33",
        mist: "#E3E9F1",
        line: "#D3DCE7",
        orbit: { DEFAULT: "#FFAA18", soft: "#FFBB45", ink: "#A35F00" },
        aero: "#E83B3B",
        signal: "#33475F",
        ink: { DEFAULT: "#0F1E36", muted: "#4B5D76", faint: "#66778F" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "14px" },
      maxWidth: { content: "1160px" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        orbit: { to: { transform: "rotate(360deg)" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        twinkle: { "0%, 100%": { opacity: "0.25" }, "50%": { opacity: "1" } },
      },
      animation: {
        "fade-up": "fade-up 320ms cubic-bezier(.2,.7,.2,1) both",
        orbit: "orbit 60s linear infinite",
        twinkle: "twinkle 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
