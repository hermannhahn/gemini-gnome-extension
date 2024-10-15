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
                {
                    label: 'Ava Multilingual Neural',
                    voice: 'en-US-AvaMultilingualNeural4',
                },
                {
                    label: 'Andrew Multilingual Neural',
                    voice: 'en-US-AndrewMultilingualNeural4',
                },
                {
                    label: 'Emma Multilingual Neural',
                    voice: 'en-US-EmmaMultilingualNeural4',
                },
                {
                    label: 'Brian Multilingual Neural',
                    voice: 'en-US-BrianMultilingualNeural4',
                },
                {
                    label: 'Ava Neural',
                    voice: 'en-US-AvaNeural',
                },
                {
                    label: 'Andrew Neural',
                    voice: 'en-US-AndrewNeural',
                },
                {
                    label: 'Emma Neural',
                    voice: 'en-US-EmmaNeural',
                },
                {
                    label: 'Brian Neural',
                    voice: 'en-US-BrianNeural',
                },
                {
                    label: 'Jenny Neural',
                    voice: 'en-US-JennyNeural',
                },
                {
                    label: 'Guy Neural',
                    voice: 'en-US-GuyNeural',
                },
                {
                    label: 'Aria Neural',
                    voice: 'en-US-AriaNeural',
                },
                {
                    label: 'Davis Neural',
                    voice: 'en-US-DavisNeural',
                },
                {
                    label: 'Jane Neural',
                    voice: 'en-US-JaneNeural',
                },
                {
                    label: 'Jason Neural',
                    voice: 'en-US-JasonNeural',
                },
                {
                    label: 'Sara Neural',
                    voice: 'en-US-SaraNeural',
                },
                {
                    label: 'Tony Neural',
                    voice: 'en-US-TonyNeural',
                },
                {
                    label: 'Nancy Neural',
                    voice: 'en-US-NancyNeural',
                },
                {
                    label: 'Amber Neural',
                    voice: 'en-US-AmberNeural',
                },
                {
                    label: 'Ana Neural',
                    voice: 'en-US-AnaNeural',
                },
                {
                    label: 'Ashley Neural',
                    voice: 'en-US-AshleyNeural',
                },
                {
                    label: 'Brandon Neural',
                    voice: 'en-US-BrandonNeural',
                },
                {
                    label: 'Christopher Neural',
                    voice: 'en-US-ChristopherNeural',
                },
                {
                    label: 'Cora Neural',
                    voice: 'en-US-CoraNeural',
                },
                {
                    label: 'Elizabeth Neural',
                    voice: 'en-US-ElizabethNeural',
                },
                {
                    label: 'Eric Neural',
                    voice: 'en-US-EricNeural',
                },
                {
                    label: 'Jacob Neural',
                    voice: 'en-US-JacobNeural',
                },
                {
                    label: 'Jenny Multilingual Neural',
                    voice: 'en-US-JennyMultilingualNeural4',
                },
                {
                    label: 'Michelle Neural',
                    voice: 'en-US-MichelleNeural',
                },
                {
                    label: 'Monica Neural',
                    voice: 'en-US-MonicaNeural',
                },
                {
                    label: 'Roger Neural',
                    voice: 'en-US-RogerNeural',
                },
                {
                    label: 'Ryan Multilingual Neural',
                    voice: 'en-US-RyanMultilingualNeural4',
                },
                {
                    label: 'Steffan Neural',
                    voice: 'en-US-SteffanNeural',
                },
                {
                    label: 'Adam Multilingual Neural',
                    voice: 'en-US-AdamMultilingualNeural1,4',
                },
                {
                    label: 'AIGenerate 1 Neural',
                    voice: 'en-US-AIGenerate1Neural1',
                },
                {
                    label: 'AIGenerate 2 Neural',
                    voice: 'en-US-AIGenerate2Neural1',
                },
                {
                    label: 'Alloy Turbo Multilingual Neural',
                    voice: 'en-US-AlloyTurboMultilingualNeural1,4',
                },
                {
                    label: 'Amanda Multilingual Neural',
                    voice: 'en-US-AmandaMultilingualNeural1,4',
                },
                {
                    label: 'Blue Neural',
                    voice: 'en-US-BlueNeural1',
                },
                {
                    label: 'Brandon Multilingual Neural',
                    voice: 'en-US-BrandonMultilingualNeural1,4',
                },
                {
                    label: 'Christopher Multilingual Neural',
                    voice: 'en-US-ChristopherMultilingualNeural1,4',
                },
                {
                    label: 'Cora Multilingual Neural',
                    voice: 'en-US-CoraMultilingualNeural1,4',
                },
                {
                    label: 'Davis Multilingual Neural',
                    voice: 'en-US-DavisMultilingualNeural1,4',
                },
                {
                    label: 'Derek Multilingual Neural',
                    voice: 'en-US-DerekMultilingualNeural1,4',
                },
                {
                    label: 'Dustin Multilingual Neural',
                    voice: 'en-US-DustinMultilingualNeural1,4',
                },
                {
                    label: 'Evelyn Multilingual Neural',
                    voice: 'en-US-EvelynMultilingualNeural1,4',
                },
                {
                    label: 'Kai Neural',
                    voice: 'en-US-KaiNeural1',
                },
                {
                    label: 'Lewis Multilingual Neural',
                    voice: 'en-US-LewisMultilingualNeural1,4',
                },
                {
                    label: 'Lola Multilingual Neural',
                    voice: 'en-US-LolaMultilingualNeural1,4',
                },
                {
                    label: 'Luna Neural',
                    voice: 'en-US-LunaNeural1',
                },
                {
                    label: 'Nancy Multilingual Neural',
                    voice: 'en-US-NancyMultilingualNeural1,4',
                },
                {
                    label: 'Nova Turbo Multilingual Neural',
                    voice: 'en-US-NovaTurboMultilingualNeural1,4',
                },
                {
                    label: 'Phoebe Multilingual Neural',
                    voice: 'en-US-PhoebeMultilingualNeural1,4',
                },
                {
                    label: 'Samuel Multilingual Neural',
                    voice: 'en-US-SamuelMultilingualNeural1,4',
                },
                {
                    label: 'Serena Multilingual Neural',
                    voice: 'en-US-SerenaMultilingualNeural1,4',
                },
                {
                    label: 'Steffan Multilingual Neural',
                    voice: 'en-US-SteffanMultilingualNeural1,4',
                },
                {
                    label: 'Alloy Multilingual Neural HD',
                    voice: 'en-US-AlloyMultilingualNeural5',
                },
                {
                    label: 'Echo Multilingual Neural HD',
                    voice: 'en-US-EchoMultilingualNeural5',
                },
                {
                    label: 'Fable Multilingual Neural HD',
                    voice: 'en-US-FableMultilingualNeural5',
                },
                {
                    label: 'Onyx Multilingual Neural HD',
                    voice: 'en-US-OnyxMultilingualNeural5',
                },
                {
                    label: 'Nova Multilingual Neural HD',
                    voice: 'en-US-NovaMultilingualNeural5',
                },
                {
                    label: 'Shimmer Multilingual Neural HD',
                    voice: 'en-US-ShimmerMultilingualNeural5',
                },
                {
                    label: 'Alloy Multilingual Neural HD',
                    voice: 'en-US-AlloyMultilingualNeuralHD5',
                },
                {
                    label: 'Echo Multilingual Neural HD',
                    voice: 'en-US-EchoMultilingualNeuralHD5',
                },
                {
                    label: 'Fable Multilingual Neural HD',
                    voice: 'en-US-FableMultilingualNeuralHD5',
                },
                {
                    label: 'Onyx Multilingual Neural HD',
                    voice: 'en-US-OnyxMultilingualNeuralHD5',
                },
                {
                    label: 'Nova Multilingual Neural HD',
                    voice: 'en-US-NovaMultilingualNeuralHD5',
                },
                {
                    label: 'Shimmer Multilingual Neural HD',
                    voice: 'en-US-ShimmerMultilingualNeuralHD5',
                },
            ],
            'pt-BR': [
                {
                    label: 'Francisca Neural',
                    voice: 'pt-BR-FranciscaNeural',
                },
                {
                    label: 'Antônio Neural',
                    voice: 'pt-BR-AntonioNeural',
                },
                {
                    label: 'Brenda Neural',
                    voice: 'pt-BR-BrendaNeural',
                },
                {
                    label: 'Donato Neural',
                    voice: 'pt-BR-DonatoNeural',
                },
                {
                    label: 'Elza Neural',
                    voice: 'pt-BR-ElzaNeural',
                },
                {
                    label: 'Fábio Neural',
                    voice: 'pt-BR-FabioNeural',
                },
                {
                    label: 'Giovanna Neural',
                    voice: 'pt-BR-GiovannaNeural',
                },
                {
                    label: 'Humberto Neural',
                    voice: 'pt-BR-HumbertoNeural',
                },
                {
                    label: 'Júlio Neural',
                    voice: 'pt-BR-JulioNeural',
                },
                {
                    label: 'Leila Neural',
                    voice: 'pt-BR-LeilaNeural',
                },
                {
                    label: 'Letícia Neural',
                    voice: 'pt-BR-LeticiaNeural',
                },
                {
                    label: 'Manuela Neural',
                    voice: 'pt-BR-ManuelaNeural',
                },
                {
                    label: 'Nicolau Neural',
                    voice: 'pt-BR-NicolauNeural',
                },
                {
                    label: 'Thalita Neural',
                    voice: 'pt-BR-ThalitaNeural',
                },
                {
                    label: 'Valério Neural',
                    voice: 'pt-BR-ValerioNeural',
                },
                {
                    label: 'Yara Neural',
                    voice: 'pt-BR-YaraNeural',
                },
                {
                    label: 'Macério Multilingual Neural',
                    voice: 'pt-BR-MacerioMultilingualNeural1,4',
                },
                {
                    label: 'Thalita Multilingual Neural',
                    voice: 'pt-BR-ThalitaMultilingualNeural1,4',
                },
            ],
            'es-ES': [
                {
                    label: 'Elvira Neural',
                    voice: 'es-ES-ElviraNeural',
                },
                {
                    label: 'Álvaro Neural',
                    voice: 'es-ES-AlvaroNeural',
                },
                {
                    label: 'Abril Neural',
                    voice: 'es-ES-AbrilNeural',
                },
                {
                    label: 'Arnau Neural',
                    voice: 'es-ES-ArnauNeural',
                },
                {
                    label: 'Darío Neural',
                    voice: 'es-ES-DarioNeural',
                },
                {
                    label: 'Elías Neural',
                    voice: 'es-ES-EliasNeural',
                },
                {
                    label: 'Estrella Neural',
                    voice: 'es-ES-EstrellaNeural',
                },
                {
                    label: 'Irene Neural',
                    voice: 'es-ES-IreneNeural',
                },
                {
                    label: 'Laia Neural',
                    voice: 'es-ES-LaiaNeural',
                },
                {
                    label: 'Lía Neural',
                    voice: 'es-ES-LiaNeural',
                },
                {
                    label: 'Nil Neural',
                    voice: 'es-ES-NilNeural',
                },
                {
                    label: 'Saúl Neural',
                    voice: 'es-ES-SaulNeural',
                },
                {
                    label: 'Teo Neural',
                    voice: 'es-ES-TeoNeural',
                },
                {
                    label: 'Triana Neural',
                    voice: 'es-ES-TrianaNeural',
                },
                {
                    label: 'Vera Neural',
                    voice: 'es-ES-VeraNeural',
                },
                {
                    label: 'Ximena Neural',
                    voice: 'es-ES-XimenaNeural',
                },
                {
                    label: 'Arabella Multilingüe Neural',
                    voice: 'es-ES-ArabellaMultilingualNeural1,4',
                },
                {
                    label: 'Isidora Multilingüe Neural',
                    voice: 'es-ES-IsidoraMultilingualNeural1,4',
                },
                {
                    label: 'Tristan Multilingüe Neural',
                    voice: 'es-ES-TristanMultilingualNeural1,4',
                },
                {
                    label: 'Ximena Multilingüe Neural',
                    voice: 'es-ES-XimenaMultilingualNeural1,4',
                },
            ],
            'fr-FR': [
                {
                    label: 'Denise Neural',
                    voice: 'fr-FR-DeniseNeural',
                },
                {
                    label: 'Henri Neural',
                    voice: 'fr-FR-HenriNeural',
                },
                {
                    label: 'Alain Neural',
                    voice: 'fr-FR-AlainNeural',
                },
                {
                    label: 'Brigitte Neural',
                    voice: 'fr-FR-BrigitteNeural',
                },
                {
                    label: 'Céleste Neural',
                    voice: 'fr-FR-CelesteNeural',
                },
                {
                    label: 'Claude Neural',
                    voice: 'fr-FR-ClaudeNeural',
                },
                {
                    label: 'Coralie Neural',
                    voice: 'fr-FR-CoralieNeural',
                },
                {
                    label: 'Éloïse Neural',
                    voice: 'fr-FR-EloiseNeural',
                },
                {
                    label: 'Jacqueline Neural',
                    voice: 'fr-FR-JacquelineNeural',
                },
                {
                    label: 'Jérôme Neural',
                    voice: 'fr-FR-JeromeNeural',
                },
                {
                    label: 'Joséphine Neural',
                    voice: 'fr-FR-JosephineNeural',
                },
                {
                    label: 'Maurice Neural',
                    voice: 'fr-FR-MauriceNeural',
                },
                {
                    label: 'Rémy Multilingue Neural',
                    voice: 'fr-FR-RemyMultilingualNeural4',
                },
                {
                    label: 'Vivienne Multilingue Neural',
                    voice: 'fr-FR-VivienneMultilingualNeural4',
                },
                {
                    label: 'Yves Neural',
                    voice: 'fr-FR-YvesNeural',
                },
                {
                    label: 'Yvette Neural',
                    voice: 'fr-FR-YvetteNeural',
                },
                {
                    label: 'Lucien Multilingue Neural',
                    voice: 'fr-FR-LucienMultilingualNeural1,4',
                },
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
