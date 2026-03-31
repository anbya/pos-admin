import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true, // biar bisa diakses dari luar localhost
    allowedHosts: [
      'vocal-luckily-fish.ngrok-free.app' // ganti sesuai domain ngrok kamu
    ]
  }
})