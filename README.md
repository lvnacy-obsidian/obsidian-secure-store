# Secure Store for Obsidian

**Infrastructure plugin providing encrypted storage for API keys and secrets.**

Other Obsidian plugins can use Secure Store as a library to store sensitive data with AES-256 encryption, eliminating the need to hardcode credentials or store them in plain text.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Features](#features)
- [For End Users](#for-end-users)
  - [Installation](#installation)
  - [What This Plugin Does](#what-this-plugin-does)
  - [Settings](#settings)
  - [Security](#security)
- [For Plugin Developers](#for-plugin-developers)
  - [Quick Start](#quick-start)
  - [Why Use Secure Store?](#why-use-secure-store)
  - [Installation Check](#installation-check)
  - [Basic API Usage](#basic-api-usage)
  - [Integration Patterns](#integration-patterns)
  - [Complete Examples](#complete-examples)
  - [API Reference](#api-reference)
  - [Best Practices](#best-practices)
  - [Advanced Usage](#advanced-usage)
  - [Error Handling](#error-handling)
  - [Testing Your Integration](#testing-your-integration)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Features

- 🔐 **AES-256-GCM encryption** for all stored data
- 🔌 **Simple API** - 6 core methods, no crypto knowledge needed
- 🏷️ **Automatic namespacing** - each plugin gets isolated storage
- 💾 **Native Obsidian storage** - uses Obsidian's data directory
- 🌍 **Cross-platform** - works on desktop and mobile (Electron + Capacitor)
- 🔑 **Auto-generated keys** - vault-specific encryption keys via PBKDF2
- 🎯 **Zero dependencies** - uses native Web Crypto API

---

## For End Users

### Installation

1. Open Obsidian Settings
2. Navigate to **Community Plugins** and disable Safe Mode
3. Click **Browse** and search for "Secure Store"
4. Click **Install**, then **Enable**

### What This Plugin Does

Secure Store is an **infrastructure plugin** - it doesn't do anything on its own. Instead, it provides encrypted storage that other plugins can use to store API keys and secrets securely.

**Think of it like this:**
- Without Secure Store: Plugins store API keys in plain text files
- With Secure Store: Plugins store API keys encrypted with military-grade encryption

### Settings

Access settings via **Settings → Community Plugins → Secure Store → Options**

#### General Settings
- **Show notifications**: Display a notice when the plugin loads

#### Diagnostics
- **View registered plugins**: See which plugins are using Secure Store
- **Clear plugin data**: Remove credentials for individual plugins (the plugin will ask for credentials again)

#### Data Management
- **Clear all secure data**: Nuclear option to delete ALL encrypted credentials from ALL plugins (requires confirmation)

### Security

- **Encryption**: AES-256-GCM (same encryption used by governments and militaries)
- **Key Derivation**: PBKDF2 with 100,000 iterations and SHA-256
- **Isolation**: Each plugin gets its own namespace - plugins cannot access each other's data
- **Vault-Specific**: Encryption keys are derived from your vault name, so data is tied to your specific vault
- **Storage Location**: Encrypted data stored in `.obsidian/plugins/secure-store/data.json`

**What this means for you:**
- Your API keys are encrypted and cannot be read without the encryption key
- Even if someone gets your `data.json` file, they cannot decrypt it without your vault
- Each plugin's data is isolated from other plugins

---

## For Plugin Developers

### Quick Start

```typescript
// 1. Check if Secure Store is available
const secureStore = this.app.plugins.plugins['secure-store'];
if (!secureStore) {
  new Notice('Please install Secure Store plugin');
  return;
}

// 2. Create a store for your plugin
const store = secureStore.createStore(this.manifest.id);

// 3. Store a credential
await store.store('api_key', 'sk-1234567890');

// 4. Retrieve it later
const apiKey = await store.retrieve('api_key');
```

### Why Use Secure Store?

#### ❌ Without Secure Store

```json
// .obsidian/plugins/your-plugin/data.json
{
  "apiKey": "sk-1234567890abcdef",
  "apiSecret": "super-secret-token"
}
```

**Problems:**
- Credentials stored in **plain text**
- Visible to anyone with file access
- Risk if vault is synced to cloud
- Risk if vault is backed up
- Risk if vault is shared

#### ✅ With Secure Store

```json
// .obsidian/plugins/secure-store/data.json
{
  "secure_keys_your-plugin": {
    "api_key": "8x9mK3pL2...encrypted-gibberish...7nQ4vR1zW"
  }
}
```

**Benefits:**
- Credentials **encrypted with AES-256**
- Cannot be read without decryption key
- Safe to sync and backup
- Simple API - no crypto expertise needed
- Isolated from other plugins

### Installation Check

Always check if Secure Store is installed before using it:

```typescript
const secureStore = this.app.plugins.plugins['secure-store'];

if (!secureStore) {
  new Notice('Please install the Secure Store plugin to use this feature');
  // Option 1: Disable features that need credentials
  // Option 2: Fall back to less secure storage with warning
  // Option 3: Guide user to install Secure Store
  return;
}
```

### Basic API Usage

```typescript
// Create a store instance (do this once, typically in onload)
const store = secureStore.createStore(this.manifest.id);

// Store a credential
await store.store('api_key', 'sk-1234567890abcdef');

// Retrieve a credential
const apiKey = await store.retrieve('api_key');
// Returns: 'sk-1234567890abcdef' or null if not found

// Check if credential exists
const hasKey = await store.exists('api_key');
// Returns: true or false

// List all stored keys
const keys = await store.listKeys();
// Returns: ['api_key', 'api_secret', ...]

// Remove a credential
await store.remove('api_key');

// Clear all credentials for your plugin
await store.clearAll();
```

### Integration Patterns

#### Pattern 1: Simple Settings Integration

Best for plugins with a single API key.

```typescript
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type MyPlugin from './main';

export class MyPluginSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Check for Secure Store
    const secureStore = this.app.plugins.plugins['secure-store'];
    if (!secureStore) {
      this.displaySecureStoreWarning(containerEl);
      return;
    }

    const store = secureStore.createStore(this.plugin.manifest.id);

    // API Key Setting
    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your API key will be encrypted and stored securely')
      .addText(async text => {
        // Check if key already exists
        const existingKey = await store.retrieve('api_key');
        
        text
          .setPlaceholder('Enter your API key...')
          .setValue(existingKey ? '••••••••••••••••' : '')
          .onChange(async (value) => {
            // Only store if value changed and not the mask
            if (value && value !== '••••••••••••••••') {
              try {
                await store.store('api_key', value);
                new Notice('✅ API key saved securely');
              } catch (error) {
                new Notice('❌ Failed to save API key');
                console.error('Secure store error:', error);
              }
            }
          });
        
        // Use password input for security
        text.inputEl.type = 'password';
      })
      .addButton(button => button
        .setButtonText('Clear')
        .setWarning()
        .onClick(async () => {
          await store.remove('api_key');
          new Notice('API key cleared');
          this.display(); // Refresh display
        }));
  }

  private displaySecureStoreWarning(containerEl: HTMLElement): void {
    containerEl.createEl('div', {
      cls: 'mod-warning',
      text: '⚠️ Secure Store plugin not found'
    });
    containerEl.createEl('p', {
      text: 'This plugin requires Secure Store to encrypt and store API keys safely. Please install it from Community Plugins.'
    });
  }
}
```

#### Pattern 2: Multiple Credentials

Best for plugins that need multiple API keys or secrets.

```typescript
export class MyPluginSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const secureStore = this.app.plugins.plugins['secure-store'];
    if (!secureStore) {
      this.displaySecureStoreWarning(containerEl);
      return;
    }

    const store = secureStore.createStore(this.plugin.manifest.id);

    containerEl.createEl('h2', { text: 'API Credentials' });
    
    // OpenAI
    this.addCredentialSetting(
      containerEl,
      store,
      'OpenAI API Key',
      'openai_api_key',
      'Your OpenAI API key from platform.openai.com'
    );
    
    // Anthropic
    this.addCredentialSetting(
      containerEl,
      store,
      'Anthropic API Key',
      'anthropic_api_key',
      'Your Anthropic API key from console.anthropic.com'
    );
    
    // GitHub Token
    this.addCredentialSetting(
      containerEl,
      store,
      'GitHub Token',
      'github_token',
      'Personal access token from github.com/settings/tokens'
    );
  }

  private addCredentialSetting(
    containerEl: HTMLElement,
    store: any,
    name: string,
    key: string,
    description: string
  ): void {
    new Setting(containerEl)
      .setName(name)
      .setDesc(description)
      .addText(async text => {
        const existing = await store.retrieve(key);
        text
          .setPlaceholder('Enter key...')
          .setValue(existing ? '••••••••••••••••' : '')
          .onChange(async (value) => {
            if (value && value !== '••••••••••••••••') {
              try {
                await store.store(key, value);
                new Notice(`✅ ${name} saved`);
              } catch (error) {
                new Notice(`❌ Failed to save ${name}`);
                console.error(error);
              }
            }
          });
        text.inputEl.type = 'password';
      })
      .addButton(button => button
        .setButtonText('Clear')
        .setWarning()
        .onClick(async () => {
          await store.remove(key);
          new Notice(`${name} cleared`);
          this.display();
        }));
  }

  private displaySecureStoreWarning(containerEl: HTMLElement): void {
    // Same as Pattern 1
  }
}
```

#### Pattern 3: Using Credentials in Your Plugin

```typescript
export default class MyPlugin extends Plugin {
  private store: any;

  async onload() {
    // Initialize Secure Store
    const secureStore = this.app.plugins.plugins['secure-store'];
    if (secureStore) {
      this.store = secureStore.createStore(this.manifest.id);
    }

    // Add settings tab
    this.addSettingTab(new MyPluginSettingTab(this.app, this));

    // Add command that uses API
    this.addCommand({
      id: 'call-api',
      name: 'Call API',
      callback: async () => {
        await this.callAPI();
      }
    });
  }

  async callAPI() {
    if (!this.store) {
      new Notice('Secure Store not available');
      return;
    }

    // Retrieve API key
    const apiKey = await this.store.retrieve('api_key');
    
    if (!apiKey) {
      new Notice('Please configure your API key in settings');
      return;
    }

    try {
      // Use the API key
      const response = await fetch('https://api.example.com/data', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      const data = await response.json();
      // Process response...
      
    } catch (error) {
      new Notice('API call failed');
      console.error(error);
    }
  }
}
```

### Complete Examples

#### Example 1: AI Plugin with Model Selection

```typescript
export class AIPluginSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const secureStore = this.app.plugins.plugins['secure-store'];
    if (!secureStore) {
      containerEl.createEl('p', {
        cls: 'mod-warning',
        text: '⚠️ Secure Store required. Install from Community Plugins.'
      });
      return;
    }

    const store = secureStore.createStore(this.plugin.manifest.id);

    // Provider selection
    new Setting(containerEl)
      .setName('AI Provider')
      .setDesc('Choose your AI provider')
      .addDropdown(dropdown => dropdown
        .addOption('openai', 'OpenAI')
        .addOption('anthropic', 'Anthropic')
        .setValue(this.plugin.settings.provider)
        .onChange(async (value) => {
          this.plugin.settings.provider = value;
          await this.plugin.saveSettings();
          this.display(); // Refresh to show relevant API key field
        }));

    // Show relevant API key field
    if (this.plugin.settings.provider === 'openai') {
      this.addCredentialSetting(
        containerEl,
        store,
        'OpenAI API Key',
        'openai_key',
        'Get your key from platform.openai.com/api-keys'
      );
    } else if (this.plugin.settings.provider === 'anthropic') {
      this.addCredentialSetting(
        containerEl,
        store,
        'Anthropic API Key',
        'anthropic_key',
        'Get your key from console.anthropic.com'
      );
    }
  }

  private addCredentialSetting(
    containerEl: HTMLElement,
    store: any,
    name: string,
    key: string,
    description: string
  ): void {
    new Setting(containerEl)
      .setName(name)
      .setDesc(description)
      .addText(async text => {
        const existing = await store.retrieve(key);
        text
          .setPlaceholder('sk-...')
          .setValue(existing ? '••••••••••••••••' : '')
          .onChange(async (value) => {
            if (value && value !== '••••••••••••••••') {
              await store.store(key, value);
              new Notice(`✅ ${name} saved`);
            }
          });
        text.inputEl.type = 'password';
      })
      .addButton(button => button
        .setButtonText('Test')
        .onClick(async () => {
          const apiKey = await store.retrieve(key);
          if (apiKey) {
            await this.testAPIKey(apiKey);
          }
        }))
      .addButton(button => button
        .setButtonText('Clear')
        .setWarning()
        .onClick(async () => {
          await store.remove(key);
          new Notice(`${name} cleared`);
          this.display();
        }));
  }

  private async testAPIKey(apiKey: string): Promise<void> {
    new Notice('Testing API key...');
    // Implement your API test logic
  }
}
```

#### Example 2: Plugin with Validation

```typescript
export class ValidatingPluginSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const secureStore = this.app.plugins.plugins['secure-store'];
    if (!secureStore) return;

    const store = secureStore.createStore(this.plugin.manifest.id);

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Must start with "sk-" and be at least 20 characters')
      .addText(async text => {
        const existing = await store.retrieve('api_key');
        
        text
          .setPlaceholder('sk-...')
          .setValue(existing ? '••••••••••••••••' : '')
          .onChange(async (value) => {
            if (value === '••••••••••••••••') return;
            
            // Validate format
            if (!this.validateAPIKey(value)) {
              text.inputEl.addClass('is-invalid');
              new Notice('❌ Invalid API key format');
              return;
            }
            
            text.inputEl.removeClass('is-invalid');
            
            try {
              await store.store('api_key', value);
              new Notice('✅ API key saved and validated');
            } catch (error) {
              new Notice('❌ Failed to save API key');
            }
          });
        
        text.inputEl.type = 'password';
      });
  }

  private validateAPIKey(key: string): boolean {
    return key.startsWith('sk-') && key.length >= 20;
  }
}
```

#### Example 3: Migration from Plain Text Storage

```typescript
import type { MigrationMapping } from 'secure-store/types';

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;
  private store: any;

  async onload() {
    await this.loadSettings();
    
    const secureStore = this.app.plugins.plugins['secure-store'];
    if (secureStore) {
      this.store = secureStore.createStore(this.manifest.id);
      
      // Migrate from old plain text storage
      await this.migrateCredentials();
    }
    
    this.addSettingTab(new MyPluginSettingTab(this.app, this));
  }

  async migrateCredentials() {
    // Define migration mappings
    const mappings: MigrationMapping[] = [
      {
        settingsKey: 'apiKey',      // Old key in settings
        secureKey: 'api_key',       // New key in secure store
        validate: (value) => typeof value === 'string' && value.length > 0
      },
      {
        settingsKey: 'openaiKey',
        secureKey: 'openai_key',
        validate: (value) => typeof value === 'string' && value.startsWith('sk-')
      },
      {
        settingsKey: 'githubToken',
        secureKey: 'github_token'
        // No validation - will migrate any non-empty value
      }
    ];

    try {
      const result = await this.store.migrateFromPlainText(this.settings, mappings);
      
      if (result.success && result.migrated > 0) {
        // Remove migrated keys from plain text settings
        result.migratedKeys.forEach(key => {
          delete this.settings[key];
        });
        
        await this.saveSettings();
        
        console.log(`Migrated ${result.migrated} credential(s) to secure storage`);
        new Notice(`✅ Migrated ${result.migrated} credential(s) to secure storage`);
      }
      
      if (result.failed.length > 0) {
        console.warn('Some credentials failed migration:', result.failed);
        console.warn('Errors:', result.errors);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      // Don't block plugin load if migration fails
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// Example settings interface
interface MyPluginSettings {
  // These will be removed after migration
  apiKey?: string;
  openaiKey?: string;
  githubToken?: string;
  
  // Other non-credential settings
  theme: string;
  autoSave: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  theme: 'dark',
  autoSave: true
};
```
#### Migration Best Practices:

Run migration in onload() before other initialization
Delete migrated keys from plain text settings after successful migration
Use validation to ensure only valid credentials are migrated
Don't fail silently - log migration results
Handle errors gracefully - don't block plugin load if migration fails
Check for existing data - the helper automatically skips already-migrated credentials
Inform users - show a notice when migration completes

#### One-time Migration Pattern:

```typescript
async migrateCredentials() {
  // Check if migration already happened
  const migrationComplete = await this.store.exists('migration_complete');
  if (migrationComplete) {
    return; // Already migrated
  }

  const mappings: MigrationMapping[] = [
    { settingsKey: 'apiKey', secureKey: 'api_key' }
  ];

  const result = await this.store.migrateFromPlainText(this.settings, mappings);
  
  if (result.success) {
    // Mark migration as complete
    await this.store.store('migration_complete', 'true');
    
    // Clean up old keys
    result.migratedKeys.forEach(key => delete this.settings[key]);
    await this.saveSettings();
  }
}
```

### API Reference

#### `createStore(pluginId: string, passphrase?: string): APIKeyStore`

Creates or retrieves a namespaced store instance for your plugin.

**Parameters:**
- `pluginId` (string, required): Unique identifier for your plugin (use `this.manifest.id`)
- `passphrase` (string, optional): Custom encryption passphrase (auto-generated if not provided)

**Returns:** `APIKeyStore` instance

**Example:**
```typescript
const store = secureStore.createStore(this.manifest.id);
```

---

#### `store(key: string, value: string): Promise<void>`

Stores a credential securely with encryption.

**Parameters:**
- `key` (string): Identifier for the credential (e.g., 'api_key', 'oauth_token')
- `value` (string): The secret value to encrypt and store

**Throws:** Error if storage fails

**Example:**
```typescript
await store.store('api_key', 'sk-1234567890abcdef');
```

---

#### `retrieve(key: string): Promise<string | null>`

Retrieves and decrypts a stored credential.

**Parameters:**
- `key` (string): Identifier for the credential

**Returns:** Decrypted string value, or `null` if key doesn't exist

**Throws:** Error if decryption fails

**Example:**
```typescript
const apiKey = await store.retrieve('api_key');
if (apiKey) {
  // Use the API key
}
```

---

#### `exists(key: string): Promise<boolean>`

Checks if a credential exists without retrieving it.

**Parameters:**
- `key` (string): Identifier for the credential

**Returns:** `true` if key exists, `false` otherwise

**Example:**
```typescript
if (await store.exists('api_key')) {
  console.log('API key is configured');
}
```

---

#### `listKeys(): Promise<string[]>`

Lists all credential keys stored by your plugin.

**Returns:** Array of key names

**Example:**
```typescript
const keys = await store.listKeys();
// Returns: ['api_key', 'oauth_token', 'refresh_token']
```

---

#### `remove(key: string): Promise<void>`

Removes a credential from storage.

**Parameters:**
- `key` (string): Identifier for the credential to remove

**Example:**
```typescript
await store.remove('api_key');
```

---

#### `clearAll(): Promise<void>`

Removes all credentials stored by your plugin.

**⚠️ Warning:** This cannot be undone.

**Example:**
```typescript
await store.clearAll();
```

---

#### `changePassphrase(newPassphrase: string): Promise<void>`

Changes the encryption passphrase and re-encrypts all stored credentials.

**Parameters:**
- `newPassphrase` (string): New passphrase for encryption

**Note:** Only needed if you used a custom passphrase when creating the store.

**Example:**
```typescript
await store.changePassphrase('new-secure-passphrase');
```

### Best Practices

#### 1. Always Check for Secure Store

```typescript
const secureStore = this.app.plugins.plugins['secure-store'];
if (!secureStore) {
  // Handle gracefully - show warning, disable features, etc.
  return;
}
```

#### 2. Use Your Plugin's Manifest ID

```typescript
// ✅ Good - ensures unique namespace
const store = secureStore.createStore(this.manifest.id);

// ❌ Bad - hardcoded string might conflict
const store = secureStore.createStore('my-plugin');
```

#### 3. Always Use Password Input Type

```typescript
text.inputEl.type = 'password'; // Masks the credential value
```

#### 4. Show Masked Values for Existing Credentials

```typescript
const existing = await store.retrieve('api_key');
text.setValue(existing ? '••••••••••••••••' : '');
```

#### 5. Handle the Mask Sentinel

```typescript
.onChange(async (value) => {
  // Don't re-store the mask
  if (value === '••••••••••••••••') return;
  
  await store.store('api_key', value);
});
```

#### 6. Provide Clear User Feedback

```typescript
try {
  await store.store('api_key', value);
  new Notice('✅ API key saved securely');
} catch (error) {
  new Notice('❌ Failed to save API key');
  console.error(error);
}
```

#### 7. Never Log or Display Actual Credentials

```typescript
// ❌ Bad - logs the actual API key
console.log('API Key:', apiKey);

// ✅ Good - logs that key exists without exposing it
console.log('API Key loaded:', !!apiKey);
```

#### 8. Document the Dependency

In your plugin's README:

```markdown
## Requirements

This plugin requires [Secure Store](https://github.com/yourusername/obsidian-secure-store) 
to encrypt and store API keys securely. Install it from Community Plugins.
```

#### 9. Handle Errors Gracefully

```typescript
try {
  const apiKey = await store.retrieve('api_key');
  if (!apiKey) {
    new Notice('Please configure your API key in settings');
    return;
  }
  // Use API key...
} catch (error) {
  console.error('Failed to retrieve API key:', error);
  new Notice('Error accessing secure storage');
}
```

#### 10. Refresh Display After Changes

```typescript
.onClick(async () => {
  await store.remove('api_key');
  this.display(); // Refresh to show key is gone
});
```

### Advanced Usage

#### Custom Passphrases

By default, Secure Store auto-generates a vault-specific encryption key. For additional security, you can provide a custom passphrase:

```typescript
// User provides custom passphrase
const passphrase = await this.promptForPassphrase();
const store = secureStore.createStore(this.manifest.id, passphrase);

// Store credentials
await store.store('api_key', 'sk-1234567890');

// Important: User must remember the passphrase
// If they forget it, data cannot be recovered
```

**Trade-offs:**
- **Pro**: Additional layer of security
- **Con**: User must remember passphrase
- **Con**: If passphrase is lost, data is permanently inaccessible

#### Changing Passphrases

```typescript
const newPassphrase = await this.promptForNewPassphrase();
await store.changePassphrase(newPassphrase);
new Notice('✅ Passphrase changed and all data re-encrypted');
```

#### Multiple Namespaces

You can create multiple isolated stores within your plugin:

```typescript
// Store for production API keys
const prodStore = secureStore.createStore(`${this.manifest.id}-prod`);
await prodStore.store('api_key', 'sk-prod-key');

// Store for development API keys
const devStore = secureStore.createStore(`${this.manifest.id}-dev`);
await devStore.store('api_key', 'sk-dev-key');
```

### Error Handling

All Secure Store methods can throw errors. Always wrap in try-catch:

```typescript
// Storing
try {
  await store.store('api_key', value);
  new Notice('✅ Saved');
} catch (error) {
  if (error.message.includes('encryption')) {
    new Notice('❌ Encryption failed - check browser compatibility');
  } else {
    new Notice('❌ Failed to save');
  }
  console.error('Store error:', error);
}

// Retrieving
try {
  const apiKey = await store.retrieve('api_key');
  if (!apiKey) {
    // Key doesn't exist - not an error
    new Notice('Please configure your API key');
    return;
  }
} catch (error) {
  if (error.message.includes('Decryption failed')) {
    new Notice('❌ Could not decrypt - data may be corrupted');
  } else {
    new Notice('❌ Failed to load API key');
  }
  console.error('Retrieve error:', error);
}

// Listing keys
try {
  const keys = await store.listKeys();
  console.log(`Found ${keys.length} stored credentials`);
} catch (error) {
  console.error('Failed to list keys:', error);
  // Fallback to assuming no keys exist
}
```

### Testing Your Integration

#### Manual Testing Checklist

1. **Install Test**
   - [ ] Plugin detects when Secure Store is missing
   - [ ] Plugin shows appropriate warning/message
   - [ ] Plugin doesn't crash when Secure Store is missing

2. **Store Test**
   - [ ] Can enter credentials in settings
   - [ ] Credentials are masked in UI
   - [ ] Success notification appears
   - [ ] Check `data.json` - credentials should be encrypted gibberish

3. **Retrieve Test**
   - [ ] Close and reopen Obsidian
   - [ ] Plugin can still access stored credentials
   - [ ] Credentials work for API calls

4. **Remove Test**
   - [ ] Clear button removes credential
   - [ ] UI updates to show credential is gone
   - [ ] Plugin handles missing credential gracefully

5. **Edge Cases**
   - [ ] What happens if user enters empty string?
   - [ ] What happens if user enters very long string?
   - [ ] What happens if Secure Store is uninstalled while your plugin is running?

#### Automated Testing

```typescript
// Example test (using your testing framework)
describe('Secure Store Integration', () => {
  let plugin: MyPlugin;
  let store: any;

  beforeEach(() => {
    // Setup
    const secureStore = app.plugins.plugins['secure-store'];
    store = secureStore.createStore('test-plugin');
  });

  afterEach(async () => {
    // Cleanup
    await store.clearAll();
  });

  test('stores and retrieves API key', async () => {
    await store.store('api_key', 'test-key-123');
    const retrieved = await store.retrieve('api_key');
    expect(retrieved).toBe('test-key-123');
  });

  test('returns null for non-existent key', async () => {
    const retrieved = await store.retrieve('does-not-exist');
    expect(retrieved).toBeNull();
  });

  test('exists returns correct boolean', async () => {
    expect(await store.exists('api_key')).toBe(false);
    await store.store('api_key', 'test');
    expect(await store.exists('api_key')).toBe(true);
  });
});
```

---

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-secure-store.git
cd obsidian-secure-store

# Install dependencies
npm install

# Start development build (watches for changes)
npm run dev
```

### Build

```bash
# Production build
npm run build

# The build outputs main.js, manifest.json, and styles.css
```

### Dev Container

This project includes a `.devcontainer` configuration for VS Code's Dev Containers extension, providing a complete and consistent development environment.

### Project Structure

```
obsidian-secure-store/
├── main.ts              # Plugin entry point
├── secure-store.ts      # Core encryption logic
├── settings-tab.ts      # Settings UI
├── modal.ts             # Clear all data confirmation modal
├── types.ts             # TypeScript interfaces
├── manifest.json        # Plugin manifest
├── package.json         # Dependencies
└── README.md            # This file
```

---

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

1. Check if the issue already exists
2. Provide detailed reproduction steps
3. Include Obsidian version and platform (desktop/mobile)
4. Include any error messages from the console

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Test thoroughly
5. Submit a PR with a clear description of changes

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation if needed
- Test on both desktop and mobile if possible

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/lvnacy-obsidian/obsidian-secure-store/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lvnacy-obsidian/obsidian-secure-store/discussions)
- **Obsidian Forum**: [Plugin Development](https://forum.obsidian.md/c/plugin-dev/)

### For Plugin Developers

If you're integrating Secure Store into your plugin and have questions:

1. Check the [Integration Patterns](#integration-patterns) section
2. Review the [Complete Examples](#complete-examples)
3. Look at the [API Reference](#api-reference)
4. Open a discussion on GitHub

### Reporting Security Issues

If you discover a security vulnerability, please **do not** open a public issue. Instead:

1. Email security concerns [here](mailto:lvnacy.xyz@proton.me)
2. Include detailed description of the vulnerability
3. Allow reasonable time for a fix before public disclosure

### Feature Requests

Have an idea for improvement? Open an issue with:

- Clear description of the feature
- Use case and benefits
- Any implementation suggestions

---

## Frequently Asked Questions

### For End Users

**Q: Do I need this plugin?**  
A: Only if you use plugins that require it. Check your plugin's documentation.

**Q: Is my data safe?**  
A: Yes. Secure Store uses AES-256-GCM encryption, the same standard used by governments and militaries. However, encryption is only as strong as your vault security - keep your computer secure.

**Q: What happens if I uninstall Secure Store?**  
A: Plugins using Secure Store will no longer be able to access their stored credentials. They'll need to be re-entered. Your encrypted data file remains but becomes inaccessible.

**Q: Can I backup my encrypted credentials?**  
A: Yes. The encrypted data is in `.obsidian/plugins/secure-store/data.json`. You can backup this file, but it only works with the same vault (encryption is vault-specific).

**Q: What if I forget my vault passphrase?**  
A: Secure Store doesn't use your vault passphrase. It auto-generates encryption keys from your vault name. As long as you have your vault, you can access your credentials.

**Q: How do I migrate to a new vault?**  
A: You cannot migrate encrypted credentials between vaults (encryption is vault-specific). You'll need to re-enter credentials in the new vault.

### For Plugin Developers

**Q: Is Secure Store required or optional?**  
A: Make it optional but recommended. Your plugin should work without it (perhaps with warnings about plain text storage).

**Q: Can my plugin read another plugin's credentials?**  
A: No. Each plugin gets an isolated namespace. This is a security feature.

**Q: What happens if Secure Store isn't installed?**  
A: The `this.app.plugins.plugins['secure-store']` will be `undefined`. Always check before using.

**Q: Should I bundle Secure Store with my plugin?**  
A: No. Secure Store should be installed separately by users. Document it as a dependency.

**Q: Can I use this on mobile?**  
A: Yes. Secure Store uses the Web Crypto API which works in both Electron (desktop) and Capacitor (mobile).

**Q: How do I test my integration?**  
A: Install Secure Store in your development vault and test the full flow. See [Testing Your Integration](#testing-your-integration).

**Q: What if a user has credentials stored in plain text in my plugin?**  
A: Implement a migration. See [Example 3: Migration from Plain Text Storage](#example-3-migration-from-plain-text-storage).

**Q: Can I encrypt non-credential data?**  
A: Yes, but Secure Store is designed for credentials. For large amounts of data, consider performance implications.

**Q: What's the maximum size for a stored value?**  
A: No hard limit, but Secure Store is optimized for small strings (API keys, tokens). Very large values may impact performance.

**Q: Do I need to handle encryption myself?**  
A: No. Secure Store handles all encryption/decryption automatically.

**Q: What if decryption fails?**  
A: This usually means corrupted data or wrong passphrase (if using custom passphrases). Catch the error and guide the user to re-enter credentials.

---

## Technical Details

### Encryption Specifications

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV Size**: 12 bytes (96 bits) - randomly generated per encryption
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (PBKDF2)
- **Salt**: Fixed, derived from plugin namespace (consider random salt in future versions)

### How It Works

1. **Key Generation**:
   ```
   Passphrase = hash(vaultName) + pluginId + namespace
   Salt = "secure-store-" + namespace
   Key = PBKDF2(Passphrase, Salt, 100000, SHA-256, 256 bits)
   ```

2. **Encryption**:
   ```
   IV = random(12 bytes)
   Ciphertext = AES-GCM-Encrypt(Key, IV, Plaintext)
   StoredValue = Base64(IV + Ciphertext)
   ```

3. **Decryption**:
   ```
   Combined = Base64-Decode(StoredValue)
   IV = Combined[0:12]
   Ciphertext = Combined[12:]
   Plaintext = AES-GCM-Decrypt(Key, IV, Ciphertext)
   ```

### Storage Format

```json
{
  "secure_keys_plugin-id": {
    "api_key": "Zg3mK9pL...encrypted-base64...nQ7vR1zW==",
    "oauth_token": "Xh2nM8qK...encrypted-base64...mP6wS2yZ=="
  },
  "secure_keys_another-plugin": {
    "github_token": "Yj4oN1rM...encrypted-base64...oQ8xT3zA=="
  }
}
```

### Browser Compatibility

Secure Store uses the Web Crypto API, which is supported in:

- ✅ Chrome/Chromium (Electron) - Desktop
- ✅ Chrome (Capacitor) - Mobile Android
- ✅ Safari (Capacitor) - Mobile iOS

All modern browsers support Web Crypto API. No polyfills needed.

### Performance

- **Encryption**: ~1ms per operation (typical)
- **Decryption**: ~1ms per operation (typical)
- **Key Derivation**: ~50ms (happens once per store instance)

*Times measured on modern hardware. Mobile devices may be slower.*

### Security Considerations

#### What Secure Store Protects Against

✅ **Plain text exposure**: Credentials encrypted in storage files  
✅ **Casual inspection**: Cannot read credentials by opening `data.json`  
✅ **Accidental sharing**: Safe to sync/backup vaults  
✅ **Plugin isolation**: Plugins cannot access each other's credentials  

#### What Secure Store Does NOT Protect Against

❌ **Memory dumps**: Decrypted credentials exist in memory when used  
❌ **Malicious plugins**: A compromised plugin could log credentials when you use them  
❌ **Compromised system**: If your computer is compromised, all bets are off  
❌ **Weak vault security**: If someone accesses your vault, they can decrypt credentials  
❌ **Side-channel attacks**: Not designed to prevent timing attacks, etc.  

#### Best Practices for Maximum Security

1. **Keep your system secure**: Use OS-level encryption, strong passwords
2. **Vet plugins**: Only install plugins from trusted sources
3. **Be cautious with syncing**: Understand where your vault is synced
4. **Use strong vault names**: Longer vault names = stronger auto-generated keys
5. **Consider custom passphrases**: For highly sensitive credentials
6. **Rotate credentials**: Periodically change API keys
7. **Least privilege**: Only give plugins the credentials they need

---

## Roadmap

### Future Enhancements (Planned)

- [ ] Random salt generation per vault (improved security)
- [ ] Credential expiration/rotation reminders
- [ ] Audit log of credential access
- [ ] Import/export functionality (with re-encryption)
- [ ] Credential strength indicators
- [ ] Two-factor authentication support
- [ ] Biometric authentication support (mobile)
- [ ] Credential sharing between trusted vaults
- [ ] Backup key recovery mechanism

### Under Consideration

- Hardware security module (HSM) support
- Cloud-based key management (optional)
- Credential templates/generators
- Integration with password managers
- GUI for viewing/managing all credentials
- Credential usage statistics

**Vote on features**: [GitHub Discussions](https://github.com/yourusername/obsidian-secure-store/discussions)

---

## Changelog

### v1.0.0 (Initial Release)

- ✨ AES-256-GCM encryption for credentials
- ✨ Automatic namespacing per plugin
- ✨ Simple 6-method API
- ✨ Cross-platform support (desktop & mobile)
- ✨ Auto-generated vault-specific keys
- ✨ Settings UI with diagnostics
- ✨ Per-plugin and bulk data clearing
- 📚 Comprehensive documentation

---

## Acknowledgments

- **Obsidian Team**: For creating an extensible, plugin-friendly platform
- **Community Plugin Developers**: For inspiration and feedback
- **Web Crypto API**: For providing robust, native encryption
- **Contributors**: Everyone who has helped improve this plugin

---

## Related Projects

- [Obsidian API](https://github.com/obsidianmd/obsidian-api) - Official Obsidian API
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin) - Template for plugin development
- [Obsidian Plugin Stats](https://obsidian-plugin-stats.vercel.app/) - Track plugin adoption

---

## Citation

If you use Secure Store in academic work or documentation:

```bibtex
@software{obsidian_secure_store,
  author = {Your Name},
  title = {Secure Store for Obsidian},
  year = {2024},
  url = {https://github.com/yourusername/obsidian-secure-store}
}
```

---

## Contact

- **GitHub**: [@xlvnacyx](https://github.com/xlvnacyx)
- **Bluesky**: [@code.lvnacy.xyz](https://bsky.app/profile/code.lvnacy.xyz)
- **Obsidian Forum**: [@lvnacy](https://forum.obsidian.md/u/lvnacy)

---

**Note for Plugin Developers**: When documenting Secure Store as a dependency, link to this README and encourage users to install it from Community Plugins. Example:

```markdown
## Dependencies

This plugin requires [Secure Store](https://github.com/yourusername/obsidian-secure-store) 
to encrypt and store API keys securely.

### Installation
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Secure Store"
4. Install and enable it
5. Return to this plugin's settings to configure your API keys
```

---

<div align="center">

**Built with ❤️ for the Obsidian community**

[Report Bug](https://github.com/lvnacy-obsidian/obsidian-secure-store/issues) · 
[Request Feature](https://github.com/lvnacy-obsidian/obsidian-secure-store/discussions) · 
[Documentation](https://github.com/lvnacy-obsidian/obsidian-secure-store#readme)

</div>