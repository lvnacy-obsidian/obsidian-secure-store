import { Plugin } from 'obsidian';
import cryptoJS from 'crypto-js';
import type { APIKeyStorage } from './types';

/**
 * Secure storage implementation with AES encryption.
 * Each plugin gets its own namespaced storage.
 */
export class SecureStorage implements APIKeyStorage {
	private encryptionKey: string;
	private storageKey: string;

	constructor(
		private plugin: Plugin,
		private namespace: string,
		passphrase?: string
	) {
		this.storageKey = `secure_keys_${namespace}`;
		this.encryptionKey = passphrase || this.generateVaultKey();
	}

	private generateVaultKey(): string {
		const vaultId = (this.plugin.app.vault as any).id || 'default-vault';
		const pluginId = this.plugin.manifest.id;
		return cryptoJS.SHA256(`${vaultId}-${pluginId}-${this.namespace}`).toString();
	}

	private async loadStorage(): Promise<Record<string, string>> {
		const data = await this.plugin.loadData();
		return data?.[this.storageKey] || {};
	}

	private async saveStorage(storage: Record<string, string>): Promise<void> {
		const data = await this.plugin.loadData() || {};
		data[this.storageKey] = storage;
		await this.plugin.saveData(data);
	}

	async store(key: string, value: string): Promise<void> {
		try {
			const storage = await this.loadStorage();
			const encrypted = CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
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
			
			const bytes = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
			const decrypted = bytes.toString(CryptoJS.enc.Utf8);
			
			if (!decrypted) {
				throw new Error('Decryption failed - possibly wrong passphrase');
			}
			
			return decrypted;
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
}