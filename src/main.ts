import {
	Notice,
	Plugin
} from 'obsidian';
import { SecureStorage } from './secure-storage';
import { SecureStorageSettingTab } from './settings-tab';
import type {
	APIKeyStorage,
	SecureStorageSettings
} from './types';

const DEFAULT_SETTINGS: SecureStorageSettings = {
	showNotifications: true
};

/**
 * Obsidian Secure Storage Plugin
 * 
 * Provides encrypted storage for API keys and secrets.
 * Other plugins can use this as a library to store sensitive data securely.
 * 
 * Usage from other plugins:
 * ```typescript
 * const secureStoragePlugin = this.app.plugins.plugins['obsidian-secure-storage'];
 * if (secureStoragePlugin) {
 *   const storage = secureStoragePlugin.createStorage('my-plugin-id');
 *   await storage.store('api_key', 'secret-value');
 * }
 * ```
 */
export default class SecureStoragePlugin extends Plugin {
	settings!: SecureStorageSettings;
	private storageInstances: Map<string, APIKeyStorage> = new Map();

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new SecureStorageSettingTab(this.app, this));

		// Add ribbon icon
		this.addRibbonIcon('shield', 'Secure Storage', () => {
			new Notice('🔐 Secure Storage is active');
		});

		if (this.settings.showNotifications) {
			new Notice('🔐 Secure Storage loaded - plugins can now store secrets securely', 3000);
		}

		console.log('Secure Storage Plugin: Loaded and ready for use by other plugins');
	}

	onunload() {
		// Clear storage instances
		this.storageInstances.clear();
		console.log('Secure Storage Plugin: Unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Create or retrieve a namespaced storage instance for a plugin
	 * @param pluginId - Unique identifier for the calling plugin
	 * @param passphrase - Optional passphrase for encryption (uses auto-generated if not provided)
	 * @returns APIKeyStorage instance
	 */
	public createStorage(pluginId: string, passphrase?: string): APIKeyStorage {
		// Return existing instance if already created
		const cacheKey = `${pluginId}-${passphrase || 'auto'}`;
		if (this.storageInstances.has(cacheKey)) {
			return this.storageInstances.get(cacheKey)!;
		}

		// Create new namespaced storage
		const storage = new SecureStorage(this, pluginId, passphrase);
		this.storageInstances.set(cacheKey, storage);

		console.log(`Secure Storage: Created storage for plugin: ${pluginId}`);
		return storage;
	}

	/**
	 * Get all plugin IDs that are using secure storage
	 */
	public getRegisteredPlugins(): string[] {
		return Array.from(this.storageInstances.keys())
			.map(key => key.split('-')[0])
			.filter((v, i, a) => a.indexOf(v) === i); // unique
	}
}