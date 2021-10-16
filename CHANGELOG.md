# Changelog

Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## HEAD

## 1.3.4

- update dependencies

###

## 1.3.3

### Fixed

- window references during server-side rendering [#42]

## 1.3.2

### Fixed

- fix unreliable "401 Unauthorized" handling

## 1.3.1

### Fixed

- fix incorrect "connection failed" failure message
- fix uncaught exceptions from scheduled refreshes

## 1.3.0

### Added

- support for path and sameSite settings on cookie store [#35]

## 1.2.1

### Fixed

- fix SSR crash [#34]

## 1.2.0

### Added

- support for passwordless logins [#29]

## 1.1.0

### Added

- `importSession` works like `restoreSession` but does not check for a stale session first. Useful for OAuth support. [#28]

## 1.0.0

### Fixed

- `isAvailable` returns a useful boolean [#27]

## 0.12.0

### Added

- improve session management on devices that sleep by detecting wakeup [#25]
