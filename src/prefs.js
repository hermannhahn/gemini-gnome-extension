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
            'en-US': [
                'en-US-AvaMultilingualNeural4',
                'en-US-AndrewMultilingualNeural4',
                'en-US-EmmaMultilingualNeural4',
                'en-US-BrianMultilingualNeural4',
                'en-US-AvaNeural',
                'en-US-AndrewNeural',
                'en-US-EmmaNeural',
                'en-US-BrianNeural',
                'en-US-JennyNeural',
                'en-US-GuyNeural',
                'en-US-AriaNeural',
                'en-US-DavisNeural',
                'en-US-JaneNeural',
                'en-US-JasonNeural',
                'en-US-SaraNeural',
                'en-US-TonyNeural',
                'en-US-NancyNeural',
                'en-US-AmberNeural',
                'en-US-AnaNeural',
                'en-US-AshleyNeural',
                'en-US-BrandonNeural',
                'en-US-ChristopherNeural',
                'en-US-CoraNeural',
                'en-US-ElizabethNeural',
                'en-US-EricNeural',
                'en-US-JacobNeural',
                'en-US-JennyMultilingualNeural4',
                'en-US-MichelleNeural',
                'en-US-MonicaNeural',
                'en-US-RogerNeural',
                'en-US-RyanMultilingualNeural4',
                'en-US-SteffanNeural',
                'en-US-AdamMultilingualNeural1,4',
                'en-US-AIGenerate1Neural1',
                'en-US-AIGenerate2Neural1',
                'en-US-AlloyTurboMultilingualNeural1,4',
                'en-US-AmandaMultilingualNeural1,4',
                'en-US-BlueNeural1',
                'en-US-BrandonMultilingualNeural1,4',
                'en-US-ChristopherMultilingualNeural1,4',
                'en-US-CoraMultilingualNeural1,4',
                'en-US-DavisMultilingualNeural1,4',
                'en-US-DerekMultilingualNeural1,4',
                'en-US-DustinMultilingualNeural1,4',
                'en-US-EvelynMultilingualNeural1,4',
                'en-US-KaiNeural1',
                'en-US-LewisMultilingualNeural1,4',
                'en-US-LolaMultilingualNeural1,4',
                'en-US-LunaNeural1',
                'en-US-NancyMultilingualNeural1,4',
                'en-US-NovaTurboMultilingualNeural1,4',
                'en-US-PhoebeMultilingualNeural1,4',
                'en-US-SamuelMultilingualNeural1,4',
                'en-US-SerenaMultilingualNeural1,4',
                'en-US-SteffanMultilingualNeural1,4',
                'en-US-AlloyMultilingualNeural5',
                'en-US-EchoMultilingualNeural5',
                'en-US-FableMultilingualNeural5',
                'en-US-OnyxMultilingualNeural5',
                'en-US-NovaMultilingualNeural5',
                'en-US-ShimmerMultilingualNeural5',
                'en-US-AlloyMultilingualNeuralHD5',
                'en-US-EchoMultilingualNeuralHD5',
                'en-US-FableMultilingualNeuralHD5',
                'en-US-OnyxMultilingualNeuralHD5',
                'en-US-NovaMultilingualNeuralHD5',
                'en-US-ShimmerMultilingualNeuralHD5',
            ],
            'pt-BR': [
                'pt-BR-FranciscaNeural',
                'pt-BR-AntonioNeural',
                'pt-BR-BrendaNeural',
                'pt-BR-DonatoNeural',
                'pt-BR-ElzaNeural',
                'pt-BR-FabioNeural',
                'pt-BR-GiovannaNeural',
                'pt-BR-HumbertoNeural',
                'pt-BR-JulioNeural',
                'pt-BR-LeilaNeural',
                'pt-BR-LeticiaNeural',
                'pt-BR-ManuelaNeural',
                'pt-BR-NicolauNeural',
                'pt-BR-ThalitaNeural',
                'pt-BR-ValerioNeural',
                'pt-BR-YaraNeural',
                'pt-BR-MacerioMultilingualNeural1,4',
                'pt-BR-ThalitaMultilingualNeural1,4',
            ],
            'es-ES': [
                'es-ES-ElviraNeural',
                'es-ES-AlvaroNeural',
                'es-ES-AbrilNeural',
                'es-ES-ArnauNeural',
                'es-ES-DarioNeural',
                'es-ES-EliasNeural',
                'es-ES-EstrellaNeural',
                'es-ES-IreneNeural',
                'es-ES-LaiaNeural',
                'es-ES-LiaNeural',
                'es-ES-NilNeural',
                'es-ES-SaulNeural',
                'es-ES-TeoNeural',
                'es-ES-TrianaNeural',
                'es-ES-VeraNeural',
                'es-ES-XimenaNeural',
                'es-ES-ArabellaMultilingualNeural1,4',
                'es-ES-IsidoraMultilingualNeural1,4',
                'es-ES-TristanMultilingualNeural1,4',
                'es-ES-XimenaMultilingualNeural1,4',
            ],
            'fr-FR': [
                'fr-FR-DeniseNeural',
                'fr-FR-HenriNeural',
                'fr-FR-AlainNeural',
                'fr-FR-BrigitteNeural',
                'fr-FR-CelesteNeural',
                'fr-FR-ClaudeNeural',
                'fr-FR-CoralieNeural',
                'fr-FR-EloiseNeural',
                'fr-FR-JacquelineNeural',
                'fr-FR-JeromeNeural',
                'fr-FR-JosephineNeural',
                'fr-FR-MauriceNeural',
                'fr-FR-RemyMultilingualNeural4',
                'fr-FR-VivienneMultilingualNeural4',
                'fr-FR-YvesNeural',
                'fr-FR-YvetteNeural',
                'fr-FR-LucienMultilingualNeural1,4',
            ],
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
