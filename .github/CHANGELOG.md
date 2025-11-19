# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [1.0.0] - 2025-11-19

### Added
- Initial release of Secure Store plugin
- AES-256 encryption for sensitive data storage
- Plugin developer API for secure storage
- Automatic namespacing per consuming plugin
- Settings tab showing registered plugins
- Desktop and mobile platform support

### Changed
- Restructured from initial API Keys Manager concept
- Replaced crypto-js with native Web Crypto API
- Modern tooling setup with TypeScript and esbuild

[Unreleased]: https://github.com/lvnacy-obsidian/obsidian-secure-store/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lvnacy-obsidian/obsidian-secure-store/releases/tag/v1.0.0
