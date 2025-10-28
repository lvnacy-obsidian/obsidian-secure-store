import {
	App,
	PluginSettingTab,
	Setting
} from 'obsidian';
import type SecureStoragePlugin from './main';

export class SecureStorageSettingTab extends PluginSettingTab {
	plugin: SecureStoragePlugin;

	constructor(app: App, plugin: SecureStoragePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Secure Storage Settings' });

		containerEl.createEl('p', { 
			text: 'This plugin provides encrypted storage for API keys and secrets. Other plugins can use it as a library.',
			cls: 'setting-item-description'
		});

		new Setting(containerEl)
			.setName('Show notifications')
			.setDesc('Display notifications when the plugin loads')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showNotifications = value;
					await this.plugin.saveSettings();
				}));

		// Show registered plugins
		containerEl.createEl('h3', { text: 'Registered Plugins' });
		
		const registeredPlugins = this.plugin.getRegisteredPlugins();
		
		if (registeredPlugins.length === 0) {
			containerEl.createEl('p', { 
				text: 'No plugins are currently using secure storage.',
				cls: 'setting-item-description'
			});
		} else {
			const listEl = containerEl.createEl('ul');
			registeredPlugins.forEach(pluginId => {
				listEl.createEl('li', { text: pluginId });
			});
		}

		// Usage instructions
		containerEl.createEl('h3', { text: 'For Plugin Developers' });
		
		const codeBlock = containerEl.createEl('pre');
		codeBlock.createEl('code', {
			text: `
				// In your plugin:
				const secureStorage = this.app.plugins.plugins['obsidian-secure-storage'];
				if (secureStorage) {
					const storage = secureStorage.createStorage('my-plugin-id');
  
					// Store a secret
					await storage.store('api_key', 'my-secret-key');
  
					// Retrieve it later
					const apiKey = await storage.retrieve('api_key');
  
					// Remove it
					await storage.remove('api_key');
				}
			`
		});
	}
}