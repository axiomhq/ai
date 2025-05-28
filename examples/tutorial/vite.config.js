import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [dts()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/tutorial.eval.ts'),
            formats: ['es']
        }
    }
})
