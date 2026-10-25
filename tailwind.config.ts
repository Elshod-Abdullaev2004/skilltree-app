import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: "#050505",
          dark: "#111111",
          gray: "#1c1c1c",
          green: "#00ff41",
          blue: "#03a9f4",
          red: "#ff003c",
          yellow: "#ffd600",
          cyan: "#00f0ff",
        },
      },
      fontFamily: {
        mono: [
          '"Space Mono"',
          '"Fira Code"',
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
        sans: [
          '"Space Mono"',
          '"Fira Code"',
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      boxShadow: {
        "cyber-glow": "0 0 10px rgba(0, 255, 65, 0.45), 0 0 20px rgba(0, 255, 65, 0.2)",
        "cyber-glow-blue": "0 0 10px rgba(3, 169, 244, 0.45), 0 0 20px rgba(3, 169, 244, 0.2)",
        "cyber-glow-red": "0 0 10px rgba(255, 0, 60, 0.45), 0 0 20px rgba(255, 0, 60, 0.2)",
      },
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "0px",
      },
    },
  },
  plugins: [],
};
export default config;
