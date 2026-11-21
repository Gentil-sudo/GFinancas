import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Gera os ícones do app (PWA) a partir de public/logo.svg:
//   npm run icones
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { background: '#2F4FD8' },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: '#2F4FD8' },
    },
  },
  images: ['public/logo.svg'],
})
