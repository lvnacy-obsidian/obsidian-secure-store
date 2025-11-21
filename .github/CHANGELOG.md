# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-11-21

### Fixed
- Addressed ESLint errors and warnings throughout codebase
- Fixed file naming: renamed `model.ts` to `modal.ts` for consistency
- Improved code quality and adherence to linting standards

### Changed
- Updated ESLint configuration for better code quality enforcement
- Updated dependencies in package-lock.json
- Minor code cleanup and formatting improvements

## [1.0.1] - 2025-11-20

### Changed
- Internal refactoring and code improvements

## [1.0.0] - 2024-11-19

### Added
- 🔐 **AES-256-GCM encryption** for all stored credentials
- 🔌 **Simple 6-method API** for plugin developers (`store`, `retrieve`, `remove`, `exists`, `listKeys`, `clearAll`)
- 🏷️ **Automatic namespacing** - each plugin gets isolated storage
- 🔑 **Auto-generated encryption keys** - vault-specific keys via PBKDF2 with 100,000 iterations
- 💾 **Native Obsidian storage** - uses Obsidian's data directory
- 🌍 **Cross-platform support** - works on desktop (Electron) and mobile (Capacitor)
- ⚙️ **Settings UI** with diagnostics and data management
  - Show which plugins are using Secure Store
  - Clear data for individual plugins
  - Nuclear option to clear all secure data with confirmation
  - Toggle for load notifications
- 🔄 **Migration helper** - `migrateFromPlainText()` method for plugins transitioning from plain text storage
  - Validates credentials before migration
  - Skips already-migrated data
  - Detailed result reporting
  - Graceful error handling per credential
- 📚 **Comprehensive documentation**
  - Quick start guide
  - Multiple integration patterns
  - Complete real-world examples
  - API reference with all methods documented
  - Best practices guide
  - Security considerations
  - FAQ for users and developers
  - Migration guide for existing plugins
- 🎯 **Custom passphrase support** - optional user-provided encryption passphrases
- 🔄 **Passphrase changing** - re-encrypt all data with new passphrase
- ✅ **Validation support** - optional validation in migration mappings

### Changed
- **Plugin name**: Updated from "Secure Storage" to "Secure Store"
- **Description**: Simplified plugin description for clarity
- **Settings UI**: 
  - Consolidated plugin list with inline "Clear Data" buttons
  - Improved layout for better UX
  - Clear separation between diagnostics and data management
- **Documentation**: 
  - Clarified that the plugin is infrastructure/library for consuming plugins
  - Moved README.md from `.github/` to root directory
  - Comprehensive examples for multiple use cases

### Technical Details
- Uses native **Web Crypto API** (no external dependencies)
- **Encryption**: AES-256-GCM with random 12-byte IV per encryption
- **Key Derivation**: PBKDF2-SHA256 with 100,000 iterations
- **Storage Format**: Base64-encoded encrypted data with IV prepended
- **Namespacing**: Each plugin ID gets isolated storage key
- **Performance**: ~1ms encryption/decryption, ~50ms key derivation
- **Browser Compatibility**: All modern browsers supporting Web Crypto API

### Security Features
- ✅ Plain text exposure protection
- ✅ Plugin isolation - plugins cannot access each other's data
- ✅ Vault-specific encryption keys
- ✅ Authenticated encryption (GCM mode)
- ✅ Random IV per encryption operation
- ⚠️ Note: Does not protect against memory dumps or compromised systems

### Developer Experience
- **Zero crypto knowledge required** - simple API handles all encryption
- **Type-safe** - Full TypeScript support with exported interfaces
- **Error handling** - Detailed error messages for debugging
- **Migration support** - Easy transition from plain text storage
- **Testing friendly** - Clean API for unit testing
- **Well documented** - Examples for every use case

### For Plugin Developers
```typescript
// Basic usage
const store = secureStore.createStore(this.manifest.id);
await store.store('api_key', 'sk-1234567890');
const apiKey = await store.retrieve('api_key');

// Migration from plain text
const result = await store.migrateFromPlainText(this.settings, [
  { settingsKey: 'apiKey', secureKey: 'api_key' }
]);
```

### For End Users
- Install from Community Plugins
- Used automatically by compatible plugins
- View which plugins use secure storage
- Clear credentials per plugin or all at once
- All encryption happens transparently

## [Unreleased] - 2025-11-18

### Changed
- **Plugin name**: Updated from "Secure Storage" to "Secure Store"
- **Description**: Simplified plugin description for clarity
- **Settings UI**: Updated settings page title to "Secure Store Settings"
- **Documentation**: Clarified that the plugin is a library for consuming plugins
- **Developer docs**: Removed code example from settings tab (kept in README.md)
- **Project documentation**: Moved README.md from `.github/` to root directory

### Technical Details
- Updated `manifest.json`:
  - Changed `name` field from "Secure Storage" to "Secure Store"
  - Shortened description for better readability
- Updated `src/settings-tab.ts`:
  - Changed heading text to reflect new name
  - Improved description wording
  - Removed inline developer usage code block (documentation now consolidated in README)

## [Unreleased] - 2025-11-06

### Added
- AES-256 encryption for sensitive data storage
- Plugin developer API for secure storage
- Automatic namespacing per consuming plugin
- Settings tab showing registered plugins
- Desktop and mobile platform support

### Changed
- Restructured from initial API Keys Manager concept
- Replaced crypto-js with native Web Crypto API
- Modern tooling setup with TypeScript and esbuild

[Unreleased]: https://github.com/lvnacy-obsidian/obsidian-secure-store/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/lvnacy-obsidian/obsidian-secure-store/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/lvnacy-obsidian/obsidian-secure-store/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/lvnacy-obsidian/obsidian-secure-store/releases/tag/v1.0.0
