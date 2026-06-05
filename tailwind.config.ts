import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./utils/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                black: 'var(--color-black)',
                white: 'var(--color-white)',
                gray: {
                    950: 'var(--color-gray-950)',
                    900: 'var(--color-gray-900)',
                    800: 'var(--color-gray-800)',
                    700: 'var(--color-gray-700)',
                    600: 'var(--color-gray-600)',
                    500: 'var(--color-gray-500)',
                    400: 'var(--color-gray-400)',
                    300: 'var(--color-gray-300)',
                    200: 'var(--color-gray-200)',
                    100: 'var(--color-gray-100)',
                    50: 'var(--color-gray-50)',
                }
            },
            fontFamily: {
                plaster: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
};
export default config;
