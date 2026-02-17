import { defineConfig } from 'vitest/config'
import FlakinessReporter from 'vite-reporter-flakiness'

export default defineConfig({
  test: {
    reporters: [],
  },
})
