import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine base path for GitHub Pages when running in CI
// Replace 'YOUR_REPO_NAME' with your repository name if auto-detection fails
const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : ''
const isCI = !!process.env.GITHUB_ACTIONS
const base = isCI && repo ? `/${repo}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
