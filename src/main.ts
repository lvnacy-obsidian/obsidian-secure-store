import {
	Notice,
	Plugin
} from 'obsidian';
import { SecureStore } from './secure-store';
import { SecureStoreSettingTab } from './settings-tab';
import type {
	APIKeyStore,
	SecureStoreSettings
} from './types';

const DEFAULT_SETTINGS: SecureStoreSettings = {
	showNotifications: true
};

/**
 * Secure Store for Obsidian Plugins
 * 
 * Provides encrypted store for API keys and secrets.
 * Other plugins can use this as a library to store sensitive data securely.
 * 
 * Usage from other plugins:
 * ```typescript
 * const secureStorePlugin = this.app.plugins.plugins['secure-store'];
 * if (secureStorePlugin) {
 *   const store = secureStorePlugin.createStore('my-plugin-id');
 *   await store.store('api_key', 'secret-value');
 * }
 * ```
 */
export default class SecureStorePlugin extends Plugin {
	settings!: SecureStoreSettings;
	private storeInstances: Map<string, APIKeyStore> = new Map();

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new SecureStoreSettingTab(this.app, this));

		// Add ribbon icon
		this.addRibbonIcon('shield', 'Secure Store', () => {
			new Notice('🔐 Secure Store is active');
		});

		if (this.settings.showNotifications) {
			new Notice('🔐 Secure Store loaded - plugins can now store secrets securely', 3000);
		}

		console.debug('Secure Store: loaded and ready for use by other plugins');
	}

	onunload() {
		// Clear store instances
		this.storeInstances.clear();
		console.debug('Secure Store Plugin: Unloaded');
	}

	async loadSettings() {
		const data = await this.loadData() as SecureStoreSettings | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Create or retrieve a namespaced store instance for a plugin
	 * @param pluginId - Unique identifier for the calling plugin
	 * @param passphrase - Optional passphrase for encryption (uses auto-generated if not provided)
	 * @returns APIKeyStore instance
	 */
	public createStore(pluginId: string, passphrase?: string): APIKeyStore {
		// Return existing instance if already created
		const cacheKey = `${pluginId}-${passphrase ?? 'auto'}`;
		const existing = this.storeInstances.get(cacheKey);
		if (existing) {
			return existing;
		}

		// Create new namespaced store
		const store = new SecureStore(this, pluginId, passphrase);
		this.storeInstances.set(cacheKey, store);

		console.debug(`Secure Store: Created store for plugin: ${ pluginId }`);
		return store;
	}

	/**
	 * Get all plugin IDs that are using secure store
	 */
	public getRegisteredPlugins(): string[] {
		return Array.from(this.storeInstances.keys())
			.map(key => key.split('-')[0])
			.filter((v, i, a) => a.indexOf(v) === i); // unique
	}
}