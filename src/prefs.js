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

        // GEMINI API KEY
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

        // AZURE API KEY
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

        // AZURE REGION
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

        // AZURE LANGUAGE (ComboBoxText para seleção de língua)
        const labelLanguage = new Gtk.Label({
            label: _('Select Language'),
            halign: Gtk.Align.START,
        });

        // Caixa de seleção (ComboBoxText) com opções de línguas
        const languageSelector = new Gtk.ComboBoxText();
        languageSelector.append('en-US', _('English'));
        languageSelector.append('pt-BR', _('Portuguese (Brazil)'));
        languageSelector.append('es', _('Spanish'));
        languageSelector.append('fr', _('French'));

        // Define a língua padrão selecionada, com base no valor armazenado
        languageSelector.set_active_id(defaultLanguage); // Seleciona o valor armazenado

        // AZURE VOICE (ComboBoxText para seleção de voz)
        const labelVoice = new Gtk.Label({
            label: _('Select Voice'),
            halign: Gtk.Align.START,
        });

        const azureVoiceSelector = new Gtk.ComboBoxText();

        // Mapeamento das opções de voz para cada linguagem
        const voiceOptions = {
            'en-US': ['Aria', 'Guy', 'Jenny'],
            'pt-BR': ['Francisca', 'Antonio', 'Fernanda'],
            es: ['Jorge', 'Helena', 'Carlos'],
            fr: ['Celine', 'Jean', 'Marie'],
        };

        // Função para atualizar as vozes com base na linguagem selecionada
        const updateVoices = (language) => {
            azureVoiceSelector.remove_all(); // Limpa as opções atuais
            if (voiceOptions[language]) {
                voiceOptions[language].forEach((voice) => {
                    azureVoiceSelector.append_text(voice); // Adiciona as novas opções
                });
                azureVoiceSelector.set_active(0); // Define a primeira opção como ativa por padrão
            }
        };

        // Atualiza as opções de voz quando a linguagem muda
        languageSelector.connect('changed', () => {
            const selectedLanguage = languageSelector.get_active_id();
            updateVoices(selectedLanguage); // Chama a função para atualizar as vozes
        });

        // Inicializa o `azureVoiceSelector` com base na linguagem armazenada
        updateVoices(defaultLanguage);
        azureVoiceSelector.set_active_id(defaultVoice); // Seleciona a voz armazenada

        // HISTORY LOG
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
        azureVoiceSelector.set_active_id(defaultVoice);

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

            // Salva o valor selecionado da língua
            const selectedLanguage = languageSelector.get_active_id();
            this.schema.set_string('azure-speech-language', selectedLanguage);

            // Salva o valor selecionado da voz
            const selectedVoice = azureVoiceSelector.get_active_text();
            this.schema.set_string('azure-speech-voice', selectedVoice);

            this.schema.set_boolean('log-history', histroyButton.state);
            statusLabel.set_markup(_('Your preferences have been saved'));
        });

        // Adicionar elementos à grade
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
        this.main.attach(languageSelector, 2, 3, 2, 1);

        this.main.attach(labelVoice, 0, 4, 1, 1);
        this.main.attach(azureVoiceSelector, 2, 4, 2, 1);

        this.main.attach(histroyLabel, 0, 5, 1, 1);
        this.main.attach(histroyButton, 2, 5, 1, 1);

        this.main.attach(save, 0, 6, 5, 1);
        this.main.attach(statusLabel, 0, 7, 5, 1);

        this.ui.add(this.main);
    }
}
