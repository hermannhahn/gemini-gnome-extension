import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ClipboardIndicatorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();
        const settingsUI = new GeminiSettings(window._settings);
        const page = new Adw.PreferencesPage();
        page.add(settingsUI.ui);
        window.add(page);
    }
}

class GeminiSettings {
    constructor(schema) {
        this.schema = schema;
        this.ui = new Adw.PreferencesGroup({title: _('Settings:')});
        this.main = new Gtk.Grid({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            row_spacing: 10,
            column_spacing: 14,
            column_homogeneous: false,
            row_homogeneous: false,
        });
        const defaultKey = this.schema.get_string('gemini-api-key');
        const defaultSpeechKey = this.schema.get_string('azure-speech-key');
        const defaultRegion = this.schema.get_string('azure-speech-region');
        const defaultLanguage = this.schema.get_string('azure-speech-language');
        const defaultVoice = this.schema.get_string('azure-speech-voice');
        const defaultLog = this.schema.get_boolean('log-history');

        const label = new Gtk.Label({
            label: _('Gemini API Key'),
            halign: Gtk.Align.START,
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToButton = new Gtk.LinkButton({
            label: _('How to get API key?'),
            uri: 'https://github.com/wwardaww/gnome-gemini-ai?tab=readme-ov-file#using-gemini-api-key',
        });

        const labelAzure = new Gtk.Label({
            label: _('Azure Speech API Key'),
            halign: Gtk.Align.START,
        });
        const azureSpeechKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToButtonAzure = new Gtk.LinkButton({
            label: _('How to get API key?'),
            uri: 'https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/get-started-speech-to-text',
        });

        const labelRegion = new Gtk.Label({
            label: _('Azure Speech Region'),
            halign: Gtk.Align.START,
        });
        const azureRegion = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToRegion = new Gtk.Label({
            label: _('e.g. eastus'),
        });

        const labelLanguage = new Gtk.Label({
            label: _('Speech Language'),
            halign: Gtk.Align.START,
        });
        const azureLanguage = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToLanguage = new Gtk.Label({
            label: _('e.g. en-US'),
        });

        const labelVoice = new Gtk.Label({
            label: _('Speech Language'),
            halign: Gtk.Align.START,
        });
        const azureVoice = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToVoice = new Gtk.LinkButton({
            label: _('All voices'),
            uri: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt',
        });

        const histroyLabel = new Gtk.Label({
            label: _('Remember talk history'),
            halign: Gtk.Align.START,
        });
        const histroyButton = new Gtk.Switch();

        const save = new Gtk.Button({
            label: _('Save'),
        });
        const statusLabel = new Gtk.Label({
            label: '',
            useMarkup: true,
            halign: Gtk.Align.CENTER,
        });

        histroyButton.set_active(defaultLog);
        apiKey.set_text(defaultKey);
        azureSpeechKey.set_text(defaultSpeechKey);
        azureRegion.set_text(defaultRegion);
        azureLanguage.set_text(defaultLanguage);
        azureVoice.set_text(defaultVoice);

        save.connect('clicked', () => {
            this.schema.set_string(
                'gemini-api-key',
                apiKey.get_buffer().get_text(),
            );
            this.schema.set_string(
                'azure-speech-key',
                azureSpeechKey.get_buffer().get_text(),
            );
            this.schema.set_string(
                'azure-speech-region',
                azureRegion.get_buffer().get_text(),
            );
            this.schema.set_string(
                'azure-speech-language',
                azureLanguage.get_buffer().get_text(),
            );
            this.schema.set_string(
                'azure-speech-voice',
                azureVoice.get_buffer().get_text(),
            );
            this.schema.set_boolean('log-history', histroyButton.state);
            statusLabel.set_markup(_('Your preferences have been saved'));
        });

        // col, row, 1, 1
        this.main.attach(label, 0, 0, 1, 1);
        this.main.attach(apiKey, 2, 0, 2, 1);
        this.main.attach(howToButton, 4, 0, 1, 1);

        this.main.attach(labelAzure, 0, 1, 1, 1);
        this.main.attach(azureSpeechKey, 2, 1, 2, 1);
        this.main.attach(howToButtonAzure, 4, 1, 1, 1);

        this.main.attach(labelRegion, 0, 2, 1, 1);
        this.main.attach(azureRegion, 2, 2, 2, 1);
        this.main.attach(howToRegion, 4, 2, 1, 1);

        this.main.attach(labelLanguage, 0, 3, 1, 1);
        this.main.attach(azureLanguage, 2, 3, 2, 1);
        this.main.attach(howToLanguage, 4, 3, 1, 1);

        this.main.attach(labelVoice, 0, 4, 1, 1);
        this.main.attach(azureVoice, 2, 4, 2, 1);
        this.main.attach(howToVoice, 4, 4, 1, 1);

        this.main.attach(histroyLabel, 0, 5, 1, 1);
        this.main.attach(histroyButton, 2, 5, 1, 1);

        this.main.attach(save, 0, 6, 5, 1);
        this.main.attach(statusLabel, 0, 7, 5, 1);

        this.ui.add(this.main);
    }
}
