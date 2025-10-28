import { Plugin } from 'obsidian';
import type { APIKeyStorage } from './types';

/**
 * Secure storage implementation using native Web Crypto API.
 * Works in both Electron (desktop) and Capacitor (mobile) environments.
 * Each plugin gets its own namespaced storage with AES-GCM encryption.
 */
export class SecureStorage implements APIKeyStorage {
	private storageKey: string;
	private encryptionKeyPromise: Promise<CryptoKey>;

	constructor(
		private plugin: Plugin,
		private namespace: string,
		passphrase?: string
	) {
		this.storageKey = `secure_keys_${namespace}`;
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
		const salt = encoder.encode(`obsidian-secure-storage-${this.namespace}`);
		
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
		
		// Convert to base64 for storage
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
	 * Load the encrypted storage object from plugin data
	 */
	private async loadStorage(): Promise<Record<string, string>> {
		const data = await this.plugin.loadData();
		return data?.[this.storageKey] ?? {};
	}

	/**
	 * Save the encrypted storage object to plugin data
	 */
	private async saveStorage(storage: Record<string, string>): Promise<void> {
		const data = await this.plugin.loadData() ?? {};
		data[this.storageKey] = storage;
		await this.plugin.saveData(data);
	}

	async store(key: string, value: string): Promise<void> {
		try {
			const storage = await this.loadStorage();
			const encrypted = await this.encrypt(value);
			storage[key] = encrypted;
			await this.saveStorage(storage);
		} catch (error) {
			throw new Error(`Failed to store key: ${error}`);
		}
	}

	async retrieve(key: string): Promise<string | null> {
		try {
			const storage = await this.loadStorage();
			const encrypted = storage[key];
			
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
			const storage = await this.loadStorage();
			delete storage[key];
			await this.saveStorage(storage);
		} catch (error) {
			throw new Error(`Failed to remove key: ${error}`);
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const storage = await this.loadStorage();
			return key in storage;
		} catch (error) {
			throw new Error(`Failed to check key existence: ${error}`);
		}
	}

	async listKeys(): Promise<string[]> {
		try {
			const storage = await this.loadStorage();
			return Object.keys(storage);
		} catch (error) {
			throw new Error(`Failed to list keys: ${error}`);
		}
	}

	async clearAll(): Promise<void> {
		try {
			await this.saveStorage({});
		} catch (error) {
			throw new Error(`Failed to clear all keys: ${error}`);
		}
	}

	/**
	 * Change the encryption passphrase and re-encrypt all stored keys
	 */
	async changePassphrase(newPassphrase: string): Promise<void> {
		try {
			const storage = await this.loadStorage();
			const decryptedData: Record<string, string> = {};
			
			// Decrypt all values with current key
			for (const [key, encryptedValue] of Object.entries(storage)) {
				decryptedData[key] = await this.decrypt(encryptedValue);
			}
			
			// Derive new key
			this.encryptionKeyPromise = this.deriveKey(newPassphrase);
			
			// Re-encrypt all values with new key
			const reencrypted: Record<string, string> = {};
			for (const [key, value] of Object.entries(decryptedData)) {
				reencrypted[key] = await this.encrypt(value);
			}
			
			await this.saveStorage(reencrypted);
		} catch (error) {
			throw new Error(`Failed to change passphrase: ${error}`);
		}
	}
}