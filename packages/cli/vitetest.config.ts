import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'


export default defineConfig({
    plugins: [
        dts({
            outDir: 'dist/types'
        })
    ],
    optimizeDeps: {
        exclude: ['fsevents']
    },
    build: {
        target: 'es2020',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: (format, entry) => `${entry}.${format}.js`
        },
        outDir: 'dist',
        rollupOptions: {
            external: [
                'vite',
                /^vite\/.*/,  // Externalize all Vite subpaths
                'fsevents',
                /^node\:.*/,
                'fetch-retry' 
            ],
            output: {
                // preserveModules: true,
                entryFileNames: '[name].js',
                dir: 'dist'
            }
        }
    }
})
