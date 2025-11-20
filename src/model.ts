import {
	App,
	Modal,
	Setting
} from 'obsidian';

export class ConfirmClearModal extends Modal {
	onConfirm: () => void;

	constructor(app: App, onConfirm: () => void) {
		super(app);
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		contentEl.createEl('h2', { text: '⚠️ Clear All Secure Data?' });
		contentEl.createEl('p', { 
			text: 'This will permanently delete ALL encrypted credentials stored by ALL plugins using Secure Store. This action cannot be undone.'
		});
		contentEl.createEl('p', { 
			text: 'Plugins will need to re-request API keys and credentials from users.',
			cls: 'mod-warning'
		});

		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		
		new Setting(buttonContainer)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close()))
			.addButton(btn => btn
				.setButtonText('Clear All Data')
				.setWarning()
				.onClick(() => {
					this.onConfirm();
					this.close();
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}