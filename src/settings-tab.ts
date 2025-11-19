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

		containerEl.createEl('h2', { text: 'Secure Store Settings' });

		containerEl.createEl('p', { 
			text: 'This plugin provides encrypted storage for API keys and secrets, to be used as a library by consuming plugins.',
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
	}
}