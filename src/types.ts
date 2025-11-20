export interface APIKeyStore {
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

export interface MigrationMapping {
	/** Key in plain text settings */
	settingsKey: string;
	/** Key to use in secure store */
	secureKey: string;
	/** Optional validation */
	validate?: (value: string) => boolean;
}

export interface MigrationResult {
	/** Overall success */
	success: boolean;
	/** Number of credentials migrated */
	migrated: number;
	/** Keys that were migrated */
	migratedKeys: string[];
	/** Keys that failed */
	failed: string[];
	/** Error details */
	errors?: string[];
}

export interface SecureStoreSettings {
	// Reserved for future settings
	showNotifications: boolean;
}