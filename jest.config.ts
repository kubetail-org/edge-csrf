import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  collectCoverageFrom: [
    'test/**/*'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  transform: {
    '^.+\\.ts$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-typescript'] }]
  }
}

export default config
