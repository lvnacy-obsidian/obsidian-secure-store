import {
	App,
	Notice,
	PluginSettingTab,
	Setting
} from 'obsidian';
import { ConfirmClearModal } from './model';
import type SecureStorePlugin from './main';

export class SecureStoreSettingTab extends PluginSettingTab {
	plugin: SecureStorePlugin;

	constructor(app: App, plugin: SecureStorePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Secure Store Settings' });

		// Description
		const descEl = containerEl.createDiv({ cls: 'setting-item-description' });
		descEl.createEl('p', { 
			text: 'This plugin provides encrypted storage infrastructure for other plugins to store API keys and secrets securely.'
		});
		descEl.createEl('p', { 
			text: '🔒 All data is encrypted with AES-256 encryption. Each plugin gets its own isolated namespace.'
		});
		descEl.createEl('p', { 
			text: 'Note: This plugin does not store credentials itself. It is used by other plugins as a library.'
		});

		// General Settings
		containerEl.createEl('h3', { text: 'General Settings' });

		new Setting(containerEl)
			.setName('Show notifications')
			.setDesc('Display notifications when the plugin loads')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showNotifications = value;
					await this.plugin.saveSettings();
				}));

		// Diagnostics
		containerEl.createEl('h3', { text: 'Secure Store Instances' });

		const registeredPlugins = this.plugin.getRegisteredPlugins();
		
		if (registeredPlugins.length === 0) {
			containerEl.createDiv({ cls: 'setting-item-description' }).createEl('p', {
				text: 'No plugins are currently using secure storage.'
			});
		} else {
			containerEl.createDiv({ cls: 'setting-item-description' }).createEl('p', {
				text: `${registeredPlugins.length} plugin(s) currently using secure storage. You can clear data for individual plugins below.`
			});

			registeredPlugins.forEach(pluginId => {
				new Setting(containerEl)
					.setName(pluginId)
					.setDesc('Plugin using Secure Store')
					.addButton(button => button
						.setButtonText('Clear Data')
						.setWarning()
						.onClick(async () => {
							try {
								await this.clearPluginData(pluginId);
								new Notice(`✅ Cleared data for ${pluginId}`);
								this.display(); // Refresh
							} catch (error) {
								new Notice(`❌ Failed to clear data: ${error}`);
								console.error('Clear plugin data error:', error);
							}
						}));
			});
		}

		// Data Management
		containerEl.createEl('h3', { text: 'Data Management' });

		new Setting(containerEl)
			.setName('Clear all secure data')
			.setDesc('⚠️ Permanently delete ALL encrypted credentials from ALL plugins. Use with caution.')
			.addButton(button => button
				.setButtonText('Clear All Data')
				.setWarning()
				.onClick(() => {
					new ConfirmClearModal(this.app, async () => {
						try {
							await this.clearAllSecureData();
							new Notice('✅ All secure data has been cleared');
							this.display(); // Refresh
						} catch (error) {
							new Notice(`❌ Failed to clear data: ${error}`);
							console.error('Clear data error:', error);
						}
					}).open();
				}));

		// Developer Information
		containerEl.createEl('h3', { text: 'For Plugin Developers' });
		
		const devInfo = containerEl.createDiv({ cls: 'setting-item-description' });
		devInfo.createEl('p', { 
			text: 'To integrate Secure Store into your plugin, check the documentation on GitHub for examples and API reference.'
		});
		devInfo.createEl('p').innerHTML = 
			'Example: <code>const store = app.plugins.plugins[\'secure-store\'].createStore(\'your-plugin-id\');</code>';
	}

	private async clearAllSecureData(): Promise<void> {
		// Clear all plugin data from the secure store plugin's data file
		await this.plugin.saveData({});
		
		// Clear store instances cache
		this.plugin['storeInstances'].clear();
		
		console.log('Secure Store: All data cleared');
	}

	private async clearPluginData(pluginId: string): Promise<void> {
		// Get all store instances for this plugin (there may be multiple with different passphrases)
		const instancesToRemove = Array.from(this.plugin['storeInstances'].entries())
			.filter(([key]) => key.startsWith(`${pluginId}-`));
		
		// Clear data for each instance
		for (const [key, store] of instancesToRemove) {
			await store.clearAll();
			this.plugin['storeInstances'].delete(key);
		}
		
		console.log(`Secure Store: Cleared data for plugin: ${pluginId}`);
	}
}