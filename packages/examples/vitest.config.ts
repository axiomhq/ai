import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        reporters: ['verbose'],
        include: ["test/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"]
    },
})