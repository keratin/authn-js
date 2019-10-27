# Changelog

Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## HEAD

### Added

* support for path and sameSite settings on cookie store [#35]

## 1.2.1

### Fixed

* fix SSR crash [#34]

## 1.2.0

### Added

* support for passwordless logins [#29]

## 1.1.0

### Added

* `importSession` works like `restoreSession` but does not check for a stale session first. Useful for OAuth support. [#28]

## 1.0.0

### Fixed

* `isAvailable` returns a useful boolean [#27]

## 0.12.0

### Added

* improve session management on devices that sleep by detecting wakeup [#25]
