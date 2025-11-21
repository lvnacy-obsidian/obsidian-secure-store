import { Plugin } from 'obsidian';
import type {
	APIKeyStore,
	MigrationMapping,
	MigrationResult
} from './types';

/**
 * Secure store implementation using native Web Crypto API.
 * Works in both Electron (desktop) and Capacitor (mobile) environments.
 * Each plugin gets its own namespaced store with AES-GCM encryption.
 */
export class SecureStore implements APIKeyStore {
	private storeKey: string;
	private encryptionKeyPromise: Promise<CryptoKey>;

	constructor(
		private plugin: Plugin,
		private namespace: string,
		passphrase?: string
	) {
		this.storeKey = `secure_keys_${namespace}`;
		this.encryptionKeyPromise = this.deriveKey(passphrase ?? this.generateVaultKey());
	}

	/**
	 * Generate a vault-specific key for automatic encryption
	 */
	private generateVaultKey(): string {
		const vaultName = this.plugin.app.vault.getName();
		const pluginId = this.plugin.manifest.id;

		const vaultId = this.simpleHash(vaultName);
		return `${vaultId}-${pluginId}-${this.namespace}`;
	}

	/**
	 * Generate a short, deterministic hash from a string
	 */
	private simpleHash(str: string): string {
		let hash = 5381;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) + hash) + str.charCodeAt(i);
		}
		// Convert to base36 for shorter string
		return (hash >>> 0).toString(36);
	}

	/**
	 * Derive a CryptoKey from a passphrase using PBKDF2
	 */
	private async deriveKey(passphrase: string): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const passphraseData = encoder.encode(passphrase);
		
		// Use a fixed salt derived from the namespace
		// In production, you might want to store a random salt per vault
		const salt = encoder.encode(`secure-store-${this.namespace}`);
		
		// Import the passphrase as a key
		const baseKey = await crypto.subtle.importKey(
			'raw',
			passphraseData,
			'PBKDF2',
			false,
			['deriveBits', 'deriveKey']
		);
		
		// Derive a key using PBKDF2
		return crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			baseKey,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);
	}

	/**
	 * Encrypt a value using AES-GCM
	 */
	private async encrypt(value: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(value);
		const key = await this.encryptionKeyPromise;
		
		// Generate a random IV (initialization vector)
		const iv = crypto.getRandomValues(new Uint8Array(12));
		
		// Encrypt the data
		const encrypted = await crypto.subtle.encrypt(
			{
				name: 'AES-GCM',
				iv: iv
			},
			key,
			data
		);
		
		// Combine IV and encrypted data
		const combined = new Uint8Array(iv.length + encrypted.byteLength);
		combined.set(iv, 0);
		combined.set(new Uint8Array(encrypted), iv.length);
		
		// Convert to base64 for store
		return this.arrayBufferToBase64(combined);
	}

	/**
	 * Decrypt a value using AES-GCM
	 */
	private async decrypt(encryptedValue: string): Promise<string> {
		const key = await this.encryptionKeyPromise;
		const combined = this.base64ToArrayBuffer(encryptedValue);
		
		// Extract IV and encrypted data
		const iv = combined.slice(0, 12);
		const encrypted = combined.slice(12);
		
		try {
			// Decrypt the data
			const decrypted = await crypto.subtle.decrypt(
				{
					name: 'AES-GCM',
					iv: iv
				},
				key,
				encrypted
			);
			
			// Convert back to string
			const decoder = new TextDecoder();
			return decoder.decode(decrypted);
		} catch (error) {
			console.error('Decryption error:', error);
			throw new Error('Decryption failed - data may be corrupted or wrong passphrase');
		}
	}

	/**
	 * Convert ArrayBuffer to base64 string
	 */
	private arrayBufferToBase64(buffer: Uint8Array): string {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	/**
	 * Convert base64 string to ArrayBuffer
	 */
	private base64ToArrayBuffer(base64: string): Uint8Array {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	/**
	 * Load the encrypted store object from plugin data
	 */
	private async loadStore(): Promise<Record<string, string>> {
		const data = await this.plugin.loadData() as Record<string, unknown> | null;
		if (!data || typeof data !== 'object') {
			return {};
		}
		const storeData = data[this.storeKey];
		if (!storeData || typeof storeData !== 'object') {
			return {};
		}
		return storeData as Record<string, string>;
	}

	/**
	 * Save the encrypted store object to plugin data
	 */
	private async saveStore(store: Record<string, string>): Promise<void> {
		const data = (await this.plugin.loadData() as Record<string, unknown>) ?? {};
		data[this.storeKey] = store;
		await this.plugin.saveData(data);
	}

	async store(key: string, value: string): Promise<void> {
		try {
			const store = await this.loadStore();
			const encrypted = await this.encrypt(value);
			store[key] = encrypted;
			await this.saveStore(store);
		} catch (error) {
			throw new Error(`Failed to store key: ${error}`);
		}
	}

	async retrieve(key: string): Promise<string | null> {
		try {
			const store = await this.loadStore();
			const encrypted = store[key];
			
			if (!encrypted) {
				return null;
			}
			
			return await this.decrypt(encrypted);
		} catch (error) {
			throw new Error(`Failed to retrieve key: ${error}`);
		}
	}

	async remove(key: string): Promise<void> {
		try {
			const store = await this.loadStore();
			delete store[key];
			await this.saveStore(store);
		} catch (error) {
			throw new Error(`Failed to remove key: ${error}`);
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const store = await this.loadStore();
			return key in store;
		} catch (error) {
			throw new Error(`Failed to check key existence: ${error}`);
		}
	}

	async listKeys(): Promise<string[]> {
		try {
			const store = await this.loadStore();
			return Object.keys(store);
		} catch (error) {
			throw new Error(`Failed to list keys: ${error}`);
		}
	}

	async clearAll(): Promise<void> {
		try {
			await this.saveStore({});
		} catch (error) {
			throw new Error(`Failed to clear all keys: ${error}`);
		}
	}

	/**
	 * Change the encryption passphrase and re-encrypt all stored keys
	 */
	async changePassphrase(newPassphrase: string): Promise<void> {
		try {
			const store = await this.loadStore();
			const decryptedData: Record<string, string> = {};
			
			// Decrypt all values with current key
			for (const [key, encryptedValue] of Object.entries(store)) {
				decryptedData[key] = await this.decrypt(encryptedValue);
			}
			
			// Derive new key
			this.encryptionKeyPromise = this.deriveKey(newPassphrase);
			
			// Re-encrypt all values with new key
			const reencrypted: Record<string, string> = {};
			for (const [key, value] of Object.entries(decryptedData)) {
				reencrypted[key] = await this.encrypt(value);
			}
			
			await this.saveStore(reencrypted);
		} catch (error) {
			throw new Error(`Failed to change passphrase: ${error}`);
		}
	}

	/**
	 * Migrate credentials from plain text settings to secure storage.
	 * This is a helper method for plugins transitioning to Secure Store.
	 * 
	 * @param settings - The plugin's settings object containing plain text credentials
	 * @param mappings - Array of mappings from settings keys to secure keys
	 * @returns Migration result with details of what was migrated
	 * 
	 * @example
	 * ```typescript
	 * const result = await store.migrateFromPlainText(this.settings, [
	 *   { settingsKey: 'apiKey', secureKey: 'api_key' },
	 *   { settingsKey: 'openaiKey', secureKey: 'openai_key', 
	 *     validate: (v) => typeof v === 'string' && v.startsWith('sk-') }
	 * ]);
	 * 
	 * if (result.success) {
	 *   console.log(`Migrated ${result.migrated} credentials`);
	 *   // Remove migrated keys from settings
	 *   result.migratedKeys.forEach(key => delete this.settings[key]);
	 *   await this.saveSettings();
	 * }
	 * ```
	 */
	async migrateFromPlainText(
		settings: Record<string, unknown>,
		mappings: MigrationMapping[]
	): Promise<MigrationResult> {
		const result: MigrationResult = {
			success: true,
			migrated: 0,
			migratedKeys: [],
			failed: [],
			errors: []
		};

		for (const mapping of mappings) {
			const { settingsKey, secureKey, validate } = mapping;
			
			try {
				// Check if the key exists in settings
				if (!(settingsKey in settings)) {
					continue;
				}

				const value = settings[settingsKey];

				// Skip if value is null, undefined, or empty string
				if (value == null || value === '') {
					continue;
				}

				// Convert to string if not already
				let stringValue: string;
				if (typeof value === 'string') {
					stringValue = value;
				} else if (typeof value === 'number' || typeof value === 'boolean') {
					stringValue = String(value);
				} else {
					// For objects/arrays, use JSON serialization
					stringValue = JSON.stringify(value);
				}

				// Run validation if provided
				if (validate && !validate(stringValue)) {
					result.failed.push(settingsKey);
					result.errors?.push(`Validation failed for ${settingsKey}`);
					continue;
				}

				// Check if already migrated (exists in secure store)
				const alreadyMigrated = await this.exists(secureKey);
				if (alreadyMigrated) {
					// Already in secure store, skip but don't count as failure
					continue;
				}

				// Store in secure store
				await this.store(secureKey, stringValue);
				
				result.migrated++;
				result.migratedKeys.push(settingsKey);

			} catch (error) {
				result.success = false;
				result.failed.push(settingsKey);
				result.errors?.push(`Failed to migrate ${settingsKey}: ${error}`);
				console.error(`Migration error for ${settingsKey}:`, error);
			}
		}

		// Overall success if at least some migrated and no critical failures
		if (result.failed.length > 0 && result.migrated === 0) {
			result.success = false;
		}

		return result;
	}
}