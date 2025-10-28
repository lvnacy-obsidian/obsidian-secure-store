export interface APIKeyStorage {
	/** Store API key securely */
	store(key: string, value: string): Promise<void>;
	/** Retrieve API key securely */
	retrieve(key: string): Promise<string | null>;
	/** Remove API key from storage */
	remove(key: string): Promise<void>;
	/** Check if key exists */
	exists(key: string): Promise<boolean>;
	/** List all stored keys */
	listKeys(): Promise<string[]>;
	/** Clear all stored keys */
	clearAll(): Promise<void>;
}

export interface SecureStorageSettings {
	// Reserved for future settings
	showNotifications: boolean;
}

export interface PluginStorage {
	pluginId: string;
	storage: APIKeyStorage;
}