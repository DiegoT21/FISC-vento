import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Tokens de shadcn/ui (variables en src/index.css).
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        // Verde institucional de la FISC, extraído directamente del sello
        // oficial (fisc-800 = #0d6936, el color real del logo). Reemplaza
        // los 3 verdes sueltos (green-800 de Tailwind, #0c5942, #005A36)
        // que convivían sin coincidir entre sí.
        fisc: {
          50: "#edfdf4",
          100: "#d6fae6",
          200: "#a4f4c8",
          300: "#65eca1",
          400: "#1ce375",
          500: "#15ac59",
          600: "#118846",
          700: "#0d6d38",
          800: "#0d6936",
          900: "#084021",
          950: "#052915",
        },
      },
    },
  },
  plugins: [animate],
}

