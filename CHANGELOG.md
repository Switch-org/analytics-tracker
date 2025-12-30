# [2.2.0](https://github.com/switch-org/analytics-tracker/compare/v2.1.0...v2.2.0) (2025-12-30)


### Features

* ip-location, connection update with ipwho-is api ([fa1b369](https://github.com/switch-org/analytics-tracker/commit/fa1b36997ecad6f71c758f738c768090529bb2b0))

# [2.1.0](https://github.com/switch-org/analytics-tracker/compare/v2.0.0...v2.1.0) (2025-12-29)


### Features

* migrate IP geolocation to ipwho.is API with dynamic key storage ([0605f72](https://github.com/switch-org/analytics-tracker/commit/0605f7207baa590b776a3b52cbc055e98a8a22e4))

# [2.1.0](https://github.com/switch-org/analytics-tracker/compare/v2.0.0...v2.1.0) (TBD)

### Features

* **IP Geolocation API Migration**: Migrated from ip-api.com to ipwho.is API for IP-based location tracking
  - More comprehensive location data including continent, flag, connection details, and timezone information
  - Dynamic key storage: All API response keys are automatically stored, including nested objects
  - Future-proof: New fields added by the API are automatically captured without code changes
  - No API key required: Free tier with no authentication needed
* **Enhanced IP Location Data**: The `IPLocation` interface now includes all fields from the ipwho.is API response
  - New fields: `continent`, `continent_code`, `flag`, `connection`, `timezone` (with full details), `is_eu`, `postal`, `calling_code`, `capital`, `borders`
  - Full backward compatibility: All existing fields (`lat`, `lon`, `countryCode`, etc.) remain available
  - Access to full IP location data in analytics events via `ipLocationData` field

### Improvements

* Better IP location data coverage with additional metadata
* Automatic storage of all API response keys, including future additions
* Improved type definitions for IP location data

### Migration Notes

This upgrade is **fully backward compatible**. No code changes are required. See the [Upgrade Guide](./docs/upgrade-guide.md) for details on accessing new fields.

# [2.0.0](https://github.com/switch-org/analytics-tracker/compare/v1.7.0...v2.0.0) (2025-12-01)


### Features

* major improvements - event batching, retry logic, plugins, and more ([f47b0ea](https://github.com/switch-org/analytics-tracker/commit/f47b0ea0f7bde575d4d91a2ae807fb074065c55c))
* major improvements - event batching, retry logic, plugins, and more ([46d0c1c](https://github.com/switch-org/analytics-tracker/commit/46d0c1c3e8435dec70fb04e99ad0902198c1486c))


### BREAKING CHANGES

* None - all changes are backward compatible
* None - all changes are backward compatible

# [1.8.0](https://github.com/switch-org/analytics-tracker/compare/v1.7.0...v1.8.0) (2025-01-XX)

### Features

* **Event Batching & Queue System**: Automatic event batching reduces API calls by 50-90%. Events are queued and sent in configurable batches (default: 10 events per batch, 5 second intervals)
* **Offline Support**: Events are persisted to localStorage and automatically sent when connection is restored
* **Retry Logic with Exponential Backoff**: Automatic retry mechanism for failed requests with exponential backoff (1s, 2s, 4s, 8s). Configurable max retries (default: 3)
* **Enhanced Logging System**: Configurable log levels (`silent`, `error`, `warn`, `info`, `debug`) with automatic dev/prod level selection
* **Plugin/Middleware System**: Extensible plugin architecture for event transformation, filtering, and enrichment. Supports `beforeSend`, `afterSend`, and `onError` hooks
* **Session Management Improvements**: Enhanced session tracking with timeout detection (default: 30 min), automatic session renewal, and session utilities
* **Developer Debugging Tools**: Built-in debug utilities accessible via `window.__analyticsDebug` in development mode. Includes queue inspection, manual flush, and stats
* **Performance Monitoring & Metrics**: Optional metrics collection tracking events sent/queued/failed, average send time, retry counts, and error history
* **Enhanced Configuration Options**: New config options for batching (`batchSize`, `batchInterval`, `maxQueueSize`), retry (`maxRetries`, `retryDelay`), session (`sessionTimeout`), logging (`logLevel`), and metrics (`enableMetrics`)

### Improvements

* Better error handling with graceful degradation
* Improved test coverage for new features
* Enhanced TypeScript types for all new features

# [1.7.0](https://github.com/switch-org/analytics-tracker/compare/v1.6.0...v1.7.0) (2025-11-24)


### Features

* updated build ([4778be5](https://github.com/switch-org/analytics-tracker/commit/4778be5c9f41a034593c02a97c70076c480dd1ed))

# [1.6.0](https://github.com/switch-org/analytics-tracker/compare/v1.5.0...v1.6.0) (2025-11-24)


### Features

* update permissions ([553d9be](https://github.com/switch-org/analytics-tracker/commit/553d9be405d7609e2cb9853ff16535cf4b1b9e66))

# [1.5.0](https://github.com/switch-org/analytics-tracker/compare/v1.4.0...v1.5.0) (2025-11-24)


### Features

* updated ([a5d770b](https://github.com/switch-org/analytics-tracker/commit/a5d770b97719707c458601f955a98655c1baa27f))

# [1.4.0](https://github.com/switch-org/analytics-tracker/compare/v1.3.1...v1.4.0) (2025-11-24)


### Features

* updated doc ([9d606f4](https://github.com/switch-org/analytics-tracker/commit/9d606f4a735dcc7b0aeda30615328b5bda54c4bc))

## [1.3.1](https://github.com/switch-org/analytics-tracker/compare/v1.3.0...v1.3.1) (2025-11-24)


### Bug Fixes

* updated names ([c56f903](https://github.com/switch-org/analytics-tracker/commit/c56f903b9360f2dc2492e5114667dc240cca9e0c))

# [1.3.0](https://github.com/switch-org/analytics-tracker/compare/v1.2.0...v1.3.0) (2025-11-24)


### Features

* location and network detector updated ([4dd4dde](https://github.com/switch-org/analytics-tracker/commit/4dd4ddedf6e285ba4fc2cd330b6e183a8218b4e2))

# [1.2.0](https://github.com/switch-org/analytics-tracker/compare/v1.1.0...v1.2.0) (2025-11-21)


### Features

* updated . ([7667448](https://github.com/switch-org/analytics-tracker/commit/7667448d798668d14a794503b332ff36fbcacdbd))

# [1.1.0](https://github.com/switch-org/analytics-tracker/compare/v1.0.0...v1.1.0) (2025-11-21)


### Features

* test cases and added public ip tracking ([2af5fb2](https://github.com/switch-org/analytics-tracker/commit/2af5fb2c4198501f7d8900af97f0ab5bf9afcf37))
* update ip tracking if browser geolocation is undefined ([d1869d6](https://github.com/switch-org/analytics-tracker/commit/d1869d62e0f3221e88fc6493993ba18a9b4cf0b6))

# 1.0.0 (2025-11-21)


### Bug Fixes

* update workflows and configuration ([910f610](https://github.com/switch-org/analytics-tracker/commit/910f610c7a740ce49e3b3cce0d681c07ad3cb2dd))
* update workflows and configuration ([5eb48cb](https://github.com/switch-org/analytics-tracker/commit/5eb48cb38cdee415d8a20b83f0a34705230bd4f2))


### Features

* update workflows ([14586fd](https://github.com/switch-org/analytics-tracker/commit/14586fd7be5eb67a0aeb68fbe2d5b2d4de736aad))
* update workflows ([0dae885](https://github.com/switch-org/analytics-tracker/commit/0dae8858b0fba63523f1ea999132aaacb66482a2))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release with comprehensive analytics tracking
- Device detection with User-Agent Client Hints support
- Network type detection (WiFi, Cellular, Hotspot, Ethernet)
- GPS location tracking with consent management
- Attribution tracking (UTM parameters, referrer, first/last touch)
- IP geolocation utilities for server-side tracking
- React hook `useAnalytics` for easy integration
- TypeScript support with full type definitions
- Hotspot detection and gating support
- MSISDN-based location consent management
- Comprehensive test suite

[Unreleased]: https://github.com/switch-org/analytics-tracker
