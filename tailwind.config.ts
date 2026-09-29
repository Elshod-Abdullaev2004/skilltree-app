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
        manga: {
          bg: "#FBF8F1",
          paper: "#FFFDF8",
          yellow: "#FFE600",
          lime: "#B8FF01",
          cyan: "#00F0FF",
          pink: "#FF2A85",
          orange: "#FF5C00",
          purple: "#A855F7",
          ink: "#111111",
        },
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #111111",
        "brutal-sm": "2px 2px 0px 0px #111111",
        "brutal-lg": "6px 6px 0px 0px #111111",
        "brutal-active": "1px 1px 0px 0px #111111",
      },
    },
  },
  plugins: [],
};
export default config;
