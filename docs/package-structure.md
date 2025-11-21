# Package Structure

This document describes the structure of the `@atif/analytics-tracker` package.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Key Files](#key-files)
3. [Build Output](#build-output)
4. [Configuration Files](#configuration-files)
5. [GitHub Workflows](#github-workflows)
6. [Package Exports](#package-exports)
7. [Development Workflow](#development-workflow)
8. [Testing](#testing)
9. [Type Safety](#type-safety)
10. [Bundle Size](#bundle-size)
11. [Browser Support](#browser-support)
12. [Node.js Support](#nodejs-support)

## Directory Structure

```
analytics-tracker/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Continuous Integration workflow
│       └── release.yml         # Semantic Release workflow
├── src/
│   ├── detectors/              # Core detection modules
│   │   ├── network-detector.ts      # Network type detection
│   │   ├── device-detector.ts       # Device information detection
│   │   ├── location-detector.ts     # GPS location detection
│   │   └── attribution-detector.ts  # UTM & referrer tracking
│   ├── services/               # Service layer
│   │   └── analytics-service.ts     # Analytics API client
│   ├── hooks/                  # React hooks
│   │   └── useAnalytics.tsx         # Main React hook
│   ├── utils/                  # Utility functions
│   │   ├── storage.ts               # LocalStorage/SessionStorage helpers
│   │   ├── location-consent.ts      # Location consent management
│   │   └── ip-geolocation.ts        # IP geolocation utilities
│   ├── tests/                  # Test files
│   │   ├── setup.ts                 # Test environment setup
│   │   └── network-detector.test.ts # Example test
│   ├── types.ts                # TypeScript type definitions
│   └── index.ts                # Main entry point
├── dist/                       # Built output (generated)
│   ├── index.cjs.js            # CommonJS build
│   ├── index.esm.js            # ES Module build
│   ├── index.d.ts              # TypeScript definitions (ESM)
│   └── index.d.cts             # TypeScript definitions (CJS)
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── .prettierignore             # Prettier ignore patterns
├── .gitignore                  # Git ignore patterns
├── .releaserc.json             # Semantic Release configuration
├── rollup.config.mjs           # Rollup build configuration
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest test configuration
├── package.json                # npm package manifest
├── package-lock.json           # npm lock file
├── README.md                   # Package documentation
├── CHANGELOG.md                # Version changelog
├── LICENSE                     # MIT License
└── docs/                       # Documentation directory
    ├── README.md               # Documentation index
    ├── usage-guide.md          # Complete usage guide
    ├── quick-start.md          # Quick start guide
    ├── publishing.md           # Publishing guide
    └── package-structure.md    # This file
```

## Key Files

### Entry Point: `src/index.ts`

Main entry point that exports all public APIs:

- **Types**: All TypeScript interfaces and types
- **Detectors**: NetworkDetector, DeviceDetector, LocationDetector, AttributionDetector
- **Services**: AnalyticsService
- **Hooks**: useAnalytics (React hook)
- **Utilities**: Storage, location consent, IP geolocation

### Detectors (`src/detectors/`)

Core detection logic that works without React:

- **NetworkDetector**: Detects WiFi, Cellular, Hotspot, Ethernet
- **DeviceDetector**: Detects device type, OS, browser, hardware specs
- **LocationDetector**: Detects GPS location with consent management
- **AttributionDetector**: Detects UTM parameters, referrer, session tracking

### Services (`src/services/`)

Service layer for API interactions:

- **AnalyticsService**: Sends analytics data to backend API

### React Hook (`src/hooks/`)

React-specific integration:

- **useAnalytics**: Main React hook for analytics tracking

### Utilities (`src/utils/`)

Helper functions:

- **storage.ts**: LocalStorage/SessionStorage management
- **location-consent.ts**: Location consent state management
- **ip-geolocation.ts**: Server-side IP geolocation helpers

## Build Output

After running `npm run build`, the following files are generated in `dist/`:

- `index.cjs.js`: CommonJS format for Node.js
- `index.esm.js`: ES Module format for modern bundlers
- `index.d.ts`: TypeScript definitions for ES modules
- `index.d.cts`: TypeScript definitions for CommonJS

## Configuration Files

### `package.json`

Defines:
- Package name: `@atif/analytics-tracker`
- Entry points: `main`, `module`, `types`, `exports`
- Scripts: build, test, lint, format, type-check
- Dependencies: None (zero runtime deps)
- Peer dependencies: React, React-DOM
- Dev dependencies: TypeScript, Rollup, Vitest, ESLint, Prettier

### `tsconfig.json`

TypeScript compiler configuration:
- Target: ES2020
- Module: ESNext
- JSX: react-jsx (React 17+)
- Strict mode: enabled

### `rollup.config.mjs`

Build configuration:
- Creates both ESM and CJS builds
- Generates TypeScript definitions
- Externalizes React (peer dependency)

### `.eslintrc.js`

Linting rules:
- TypeScript ESLint
- React & React Hooks rules
- Prettier integration

### `vitest.config.ts`

Test configuration:
- JS DOM environment
- Coverage with v8 provider
- Test setup file

## GitHub Workflows

### `.github/workflows/ci.yml`

Runs on every push/PR:
- Lint code
- Check formatting
- Type check
- Run tests with coverage
- Build package

### `.github/workflows/release.yml`

Runs on push to `main`/`master`:
- Run tests
- Build package
- Semantic release (auto versioning & publishing)

## Package Exports

The package exports are configured in `package.json`:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.esm.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs.js"
      }
    }
  }
}
```

This allows:
- ESM: `import { useAnalytics } from '@atif/analytics-tracker'`
- CJS: `const { useAnalytics } = require('@atif/analytics-tracker')`
- TypeScript: Full type support for both formats

## Development Workflow

1. **Install dependencies**: `npm install`
2. **Develop**: Edit files in `src/`
3. **Test**: `npm test` or `npm run test:watch`
4. **Lint**: `npm run lint`
5. **Format**: `npm run format`
6. **Type check**: `npm run type-check`
7. **Build**: `npm run build` or `npm run build:watch`
8. **Publish**: Follow `PUBLISHING.md`

## Testing

Tests are located in `src/tests/`:
- `setup.ts`: Test environment setup (mocks localStorage, navigator, etc.)
- `*.test.ts`: Test files for each module

Run tests:
```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Type Safety

All exports are fully typed with TypeScript:
- Type definitions: `dist/index.d.ts`, `dist/index.d.cts`
- Source files: `.ts`, `.tsx` with strict TypeScript
- Type checking: `npm run type-check`

## Bundle Size

The package has **zero runtime dependencies** (except React as peer dependency), keeping the bundle size minimal:
- Core detectors: ~5-10 KB (gzipped)
- React hook: ~2-3 KB (gzipped)
- Total: ~10-15 KB (gzipped)

## Browser Support

- Modern browsers with ES2020 support
- Requires: navigator.connection, navigator.geolocation (optional), localStorage, sessionStorage
- Falls back gracefully when APIs are unavailable

## Node.js Support

- Minimum Node.js version: 18.0.0
- Core detectors work in Node.js (with limitations)
- React hook requires browser environment

---

This structure ensures the package is:
- ✅ Modular and maintainable
- ✅ Type-safe
- ✅ Well-tested
- ✅ Easy to use
- ✅ Production-ready

---

For more information, see:
- [Main README](../README.md) - Package documentation
- [Usage Guide](./usage-guide.md) - Complete usage guide
- [Quick Start](./quick-start.md) - Getting started guide
- [Publishing Guide](./publishing.md) - Publishing instructions

