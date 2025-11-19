# Obsidian Secure Store

Encrypted store for API keys and secrets in Obsidian, available to other plugins to consume and use to store sensitive data with AES-256 encryption.

## Features

- 🔐 AES-256 encryption for all stored data
- 🔌 Simple API for plugin developers
- 🏷️ Automatic namespacing per plugin
- 💾 Uses Obsidian's native data storage
- 🌐 Works on desktop and mobile
- 🔑 Auto-generated vault-specific encryption keys

## For Plugin Developers

### Installation

Users need to install this plugin from the Community Plugins directory.

### Usage in Your Plugin

```typescript
// Check if Secure Storage is available
const secureStoragePlugin = this.app.plugins.plugins['obsidian-secure-storage'];

if (!secureStoragePlugin) {
  new Notice('Please install the Secure Storage plugin');
  return;
}

// Create a storage instance for your plugin
const storage = secureStoragePlugin.createStorage('your-plugin-id');

// Store a secret
await storage.store('api_key', 'sk-1234567890');

// Retrieve it
const apiKey = await storage.retrieve('api_key');

// Check if exists
const hasKey = await storage.exists('api_key');

// List all keys
const keys = await storage.listKeys();

// Remove a key
await storage.remove('api_key');

// Clear all keys
await storage.clearAll();
```

### API Reference

```typescript
interface APIKeyStorage {
  store(key: string, value: string): Promise<void>;
  retrieve(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  listKeys(): Promise<string[]>;
  clearAll(): Promise<void>;
}
```

## For End Users

This plugin provides secure storage infrastructure for other plugins. Once installed, compatible plugins can store API keys and secrets securely with encryption.

### Settings

- **Show notifications**: Display notifications when the plugin loads
- **Registered Plugins**: View which plugins are using secure storage

## Security

- All data is encrypted using AES-256
- Each vault has a unique encryption key
- Each plugin gets its own namespace
- Encryption keys are derived from vault ID and plugin ID
- Data is stored in the plugin's data directory

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Secure Storage"
4. Install and enable the plugin

## License

MIT

## Support

If you find this plugin helpful, consider supporting development!

To contribute to this plugin:
1. Fork the repository
2. Clone and branch from `main`
3. Make your changes
4. Raise a PR from your feature branch; be specific in your description
  with regard to what changes you're implementing.

The project contains a `.devcontainer` directory for use with the 
[Dev Containers Extension](containers) in VS Code. It uses the 
[node-devcontainer](node) docker container to provide a complete and secure 
development environment. Simply run your project in the dev container when 
prompted and proceed to develop as normal.

---

**Note for plugin developers**: Add `obsidian-secure-storage` to your plugin's description as a recommended or required plugin.

<!--
[containers]: https://code.visualstudio.com/docs/devcontainers/containers
[node]: https://github.com/lvnacy-docker/node-devcontainer
-->