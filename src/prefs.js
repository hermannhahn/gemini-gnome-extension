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
        // Set window size to 800x600
        window.set_default_size(800, 600);
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
        const apiKeyLabel = new Gtk.Label({
            label: _('Gemini API Key'),
            halign: Gtk.Align.START,
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToButtonApiKey = new Gtk.LinkButton({
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
            label: _('e.g.: eastus, westus, ...'),
            halign: Gtk.Align.START,
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
                    voice: 'en-US-AvaMultilingualNeural',
                    label: 'Ava Multilingual Neural (4x)',
                },
                {
                    voice: 'en-US-AndrewMultilingualNeural',
                    label: 'Andrew Multilingual Neural (4x)',
                },
                {
                    voice: 'en-US-EmmaMultilingualNeural',
                    label: 'Emma Multilingual Neural (4x)',
                },
                {
                    voice: 'en-US-BrianMultilingualNeural',
                    label: 'Brian Multilingual Neural (4x)',
                },
                {
                    voice: 'en-US-AvaNeural',
                    label: 'Ava Neural',
                },
                {
                    voice: 'en-US-AndrewNeural',
                    label: 'Andrew Neural',
                },
                {
                    voice: 'en-US-EmmaNeural',
                    label: 'Emma Neural',
                },
                {
                    voice: 'en-US-BrianNeural',
                    label: 'Brian Neural',
                },
                {
                    voice: 'en-US-JennyNeural',
                    label: 'Jenny Neural',
                },
                {
                    voice: 'en-US-GuyNeural',
                    label: 'Guy Neural',
                },
                {
                    voice: 'en-US-AriaNeural',
                    label: 'Aria Neural',
                },
                {
                    voice: 'en-US-DavisNeural',
                    label: 'Davis Neural',
                },
                {
                    voice: 'en-US-JaneNeural',
                    label: 'Jane Neural',
                },
                {
                    voice: 'en-US-JasonNeural',
                    label: 'Jason Neural',
                },
                {
                    voice: 'en-US-SaraNeural',
                    label: 'Sara Neural',
                },
                {
                    voice: 'en-US-TonyNeural',
                    label: 'Tony Neural',
                },
                {
                    voice: 'en-US-NancyNeural',
                    label: 'Nancy Neural',
                },
                {
                    voice: 'en-US-AmberNeural',
                    label: 'Amber Neural',
                },
                {
                    voice: 'en-US-AnaNeural',
                    label: 'Ana Neural',
                },
                {
                    voice: 'en-US-AshleyNeural',
                    label: 'Ashley Neural',
                },
                {
                    voice: 'en-US-BrandonNeural',
                    label: 'Brandon Neural',
                },
                {
                    voice: 'en-US-ChristopherNeural',
                    label: 'Christopher Neural',
                },
                {
                    voice: 'en-US-CoraNeural',
                    label: 'Cora Neural',
                },
                {
                    voice: 'en-US-ElizabethNeural',
                    label: 'Elizabeth Neural',
                },
                {
                    voice: 'en-US-EricNeural',
                    label: 'Eric Neural',
                },
                {
                    voice: 'en-US-JacobNeural',
                    label: 'Jacob Neural',
                },
                {
                    voice: 'en-US-JennyMultilingualNeural',
                    label: 'Jenny Multilingual Neural (4x)',
                },
                {
                    voice: 'en-US-MichelleNeural',
                    label: 'Michelle Neural',
                },
                {
                    voice: 'en-US-MonicaNeural',
                    label: 'Monica Neural',
                },
                {
                    voice: 'en-US-RogerNeural',
                    label: 'Roger Neural',
                },
                {
                    voice: 'en-US-RyanMultilingualNeural',
                    label: 'Ryan Multilingual Neural (4x)',
                },
                {
                    voice: 'en-US-SteffanNeural',
                    label: 'Steffan Neural',
                },
                {
                    voice: 'en-US-AdamMultilingualNeural',
                    label: 'Adam Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-AIGenerate1Neural',
                    label: 'AIGenerate 1 Neural (1x)',
                },
                {
                    voice: 'en-US-AIGenerate2Neural',
                    label: 'AIGenerate 2 Neural (1x)',
                },
                {
                    voice: 'en-US-AlloyTurboMultilingualNeural',
                    label: 'Alloy Turbo Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-AmandaMultilingualNeural',
                    label: 'Amanda Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-BlueNeural',
                    label: 'Blue Neural (1)',
                },
                {
                    voice: 'en-US-BrandonMultilingualNeural',
                    label: 'Brandon Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-ChristopherMultilingualNeural',
                    label: 'Christopher Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-CoraMultilingualNeural',
                    label: 'Cora Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-DavisMultilingualNeural',
                    label: 'Davis Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-DerekMultilingualNeural',
                    label: 'Derek Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-DustinMultilingualNeural',
                    label: 'Dustin Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-EvelynMultilingualNeural',
                    label: 'Evelyn Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-KaiNeural',
                    label: 'Kai Neural (1x)',
                },
                {
                    voice: 'en-US-LewisMultilingualNeural',
                    label: 'Lewis Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-LolaMultilingualNeural',
                    label: 'Lola Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-LunaNeural',
                    label: 'Luna Neural (1x)',
                },
                {
                    voice: 'en-US-NancyMultilingualNeural',
                    label: 'Nancy Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-NovaTurboMultilingualNeural',
                    label: 'Nova Turbo Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-PhoebeMultilingualNeural',
                    label: 'Phoebe Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-SamuelMultilingualNeural',
                    label: 'Samuel Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-SerenaMultilingualNeural',
                    label: 'Serena Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-SteffanMultilingualNeural',
                    label: 'Steffan Multilingual Neural (1.4x)',
                },
                {
                    voice: 'en-US-AlloyMultilingualNeural',
                    label: 'Alloy Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-EchoMultilingualNeural',
                    label: 'Echo Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-FableMultilingualNeural',
                    label: 'Fable Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-OnyxMultilingualNeural',
                    label: 'Onyx Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-NovaMultilingualNeural',
                    label: 'Nova Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-ShimmerMultilingualNeural',
                    label: 'Shimmer Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-AlloyMultilingualNeuralHD',
                    label: 'Alloy Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-EchoMultilingualNeuralHD',
                    label: 'Echo Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-FableMultilingualNeuralHD',
                    label: 'Fable Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-OnyxMultilingualNeuralHD',
                    label: 'Onyx Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-NovaMultilingualNeuralHD',
                    label: 'Nova Multilingual Neural HD (5x)',
                },
                {
                    voice: 'en-US-ShimmerMultilingualNeuralHD',
                    label: 'Shimmer Multilingual Neural HD (5x)',
                },
            ],
            'pt-BR': [
                {
                    voice: 'pt-BR-FranciscaNeural',
                    label: 'Francisca Neural',
                },
                {
                    voice: 'pt-BR-AntonioNeural',
                    label: 'Antônio Neural',
                },
                {
                    voice: 'pt-BR-BrendaNeural',
                    label: 'Brenda Neural',
                },
                {
                    voice: 'pt-BR-DonatoNeural',
                    label: 'Donato Neural',
                },
                {
                    voice: 'pt-BR-ElzaNeural',
                    label: 'Elza Neural',
                },
                {
                    voice: 'pt-BR-FabioNeural',
                    label: 'Fábio Neural',
                },
                {
                    voice: 'pt-BR-GiovannaNeural',
                    label: 'Giovanna Neural',
                },
                {
                    voice: 'pt-BR-HumbertoNeural',
                    label: 'Humberto Neural',
                },
                {
                    voice: 'pt-BR-JulioNeural',
                    label: 'Júlio Neural',
                },
                {
                    voice: 'pt-BR-LeilaNeural',
                    label: 'Leila Neural',
                },
                {
                    voice: 'pt-BR-LeticiaNeural',
                    label: 'Letícia Neural',
                },
                {
                    voice: 'pt-BR-ManuelaNeural',
                    label: 'Manuela Neural',
                },
                {
                    voice: 'pt-BR-NicolauNeural',
                    label: 'Nicolau Neural',
                },
                {
                    voice: 'pt-BR-ThalitaNeural',
                    label: 'Thalita Neural',
                },
                {
                    voice: 'pt-BR-ValerioNeural',
                    label: 'Valério Neural',
                },
                {
                    voice: 'pt-BR-YaraNeural',
                    label: 'Yara Neural',
                },
                {
                    voice: 'pt-BR-MacerioMultilingualNeural',
                    label: 'Macério Multilingual Neural (1.4x)',
                },
                {
                    voice: 'pt-BR-ThalitaMultilingualNeural',
                    label: 'Thalita Multilingual Neural (1.4x)',
                },
            ],
            'es-ES': [
                {
                    voice: 'es-ES-ElviraNeural',
                    label: 'Elvira Neural',
                },
                {
                    voice: 'es-ES-AlvaroNeural',
                    label: 'Álvaro Neural',
                },
                {
                    voice: 'es-ES-AbrilNeural',
                    label: 'Abril Neural',
                },
                {
                    voice: 'es-ES-ArnauNeural',
                    label: 'Arnau Neural',
                },
                {
                    voice: 'es-ES-DarioNeural',
                    label: 'Darío Neural',
                },
                {
                    voice: 'es-ES-EliasNeural',
                    label: 'Elías Neural',
                },
                {
                    voice: 'es-ES-EstrellaNeural',
                    label: 'Estrella Neural',
                },
                {
                    voice: 'es-ES-IreneNeural',
                    label: 'Irene Neural',
                },
                {
                    voice: 'es-ES-LaiaNeural',
                    label: 'Laia Neural',
                },
                {
                    voice: 'es-ES-LiaNeural',
                    label: 'Lía Neural',
                },
                {
                    voice: 'es-ES-NilNeural',
                    label: 'Nil Neural',
                },
                {
                    voice: 'es-ES-SaulNeural',
                    label: 'Saúl Neural',
                },
                {
                    voice: 'es-ES-TeoNeural',
                    label: 'Teo Neural',
                },
                {
                    voice: 'es-ES-TrianaNeural',
                    label: 'Triana Neural',
                },
                {
                    voice: 'es-ES-VeraNeural',
                    label: 'Vera Neural',
                },
                {
                    voice: 'es-ES-XimenaNeural',
                    label: 'Ximena Neural',
                },
                {
                    voice: 'es-ES-ArabellaMultilingualNeural',
                    label: 'Arabella Multilingüe Neural (1.4x)',
                },
                {
                    voice: 'es-ES-IsidoraMultilingualNeural',
                    label: 'Isidora Multilingüe Neural (1.4x)',
                },
                {
                    voice: 'es-ES-TristanMultilingualNeural',
                    label: 'Tristan Multilingüe Neural (1.4x)',
                },
                {
                    voice: 'es-ES-XimenaMultilingualNeural',
                    label: 'Ximena Multilingüe Neural (1.4x)',
                },
            ],
            'fr-FR': [
                {
                    voice: 'fr-FR-DeniseNeural',
                    label: 'Denise Neural',
                },
                {
                    voice: 'fr-FR-HenriNeural',
                    label: 'Henri Neural',
                },
                {
                    voice: 'fr-FR-AlainNeural',
                    label: 'Alain Neural',
                },
                {
                    voice: 'fr-FR-BrigitteNeural',
                    label: 'Brigitte Neural',
                },
                {
                    voice: 'fr-FR-CelesteNeural',
                    label: 'Céleste Neural',
                },
                {
                    voice: 'fr-FR-ClaudeNeural',
                    label: 'Claude Neural',
                },
                {
                    voice: 'fr-FR-CoralieNeural',
                    label: 'Coralie Neural',
                },
                {
                    voice: 'fr-FR-EloiseNeural',
                    label: 'Éloïse Neural',
                },
                {
                    voice: 'fr-FR-JacquelineNeural',
                    label: 'Jacqueline Neural',
                },
                {
                    voice: 'fr-FR-JeromeNeural',
                    label: 'Jérôme Neural',
                },
                {
                    voice: 'fr-FR-JosephineNeural',
                    label: 'Joséphine Neural',
                },
                {
                    voice: 'fr-FR-MauriceNeural',
                    label: 'Maurice Neural',
                },
                {
                    voice: 'fr-FR-RemyMultilingualNeural',
                    label: 'Rémy Multilingue Neural (4x)',
                },
                {
                    voice: 'fr-FR-VivienneMultilingualNeural',
                    label: 'Vivienne Multilingue Neural (4x)',
                },
                {
                    voice: 'fr-FR-YvesNeural',
                    label: 'Yves Neural',
                },
                {
                    voice: 'fr-FR-YvetteNeural',
                    label: 'Yvette Neural',
                },
                {
                    voice: 'fr-FR-LucienMultilingualNeural',
                    label: 'Lucien Multilingue Neural (1.4x)',
                },
            ],
        };

        // Função para atualizar as vozes com base na linguagem selecionada
        const updateVoices = (language) => {
            azureVoiceSelector.remove_all(); // Limpa as opções atuais
            if (voiceOptions[language]) {
                voiceOptions[language].forEach((option) => {
                    azureVoiceSelector.append(option.voice, option.label); // Adiciona as novas opções
                    if (option.voice === defaultVoice) {
                        azureVoiceSelector.set_active_id(option.voice);
                    }
                });
            }
        };

        // Atualiza as opções de voz quando a linguagem muda
        languageSelector.connect('changed', () => {
            const selectedLanguage = languageSelector.get_active_id();
            updateVoices(selectedLanguage); // Chama a função para atualizar as vozes
        });

        // Inicializa o `azureVoiceSelector` com base na linguagem armazenada
        updateVoices(defaultLanguage);

        // HISTORY LOG
        const histroyLabel = new Gtk.Label({
            label: _('Remember talk history'),
            halign: Gtk.Align.START,
        });
        const histroyButton = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });

        const save = new Gtk.Button({
            label: _('Save'),
        });
        const statusLabel = new Gtk.Label({
            label: '',
            useMarkup: true,
            halign: Gtk.Align.CENTER,
        });

        // Set labels property
        // apiKeyLabel.set_property('padding', 40);

        // Set default
        histroyButton.set_active(defaultLog);
        apiKey.set_text(defaultKey);
        azureSpeechKey.set_text(defaultSpeechKey);
        azureRegion.set_text(defaultRegion);
        azureVoiceSelector.set_active_id(defaultVoice);
        languageSelector.set_active_id(defaultLanguage);

        // Adicionar eventos
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
            const selectedVoice = azureVoiceSelector.get_active_id();
            this.schema.set_string('azure-speech-voice', selectedVoice);

            this.schema.set_boolean('log-history', histroyButton.state);
            statusLabel.set_markup(
                _(
                    'Your preferences have been saved\n\nLanguage: ' +
                        selectedLanguage +
                        '\nSelected voice: ' +
                        selectedVoice,
                ),
            );
        });

        // Adicionar elementos à grade
        this.main.attach(apiKeyLabel, 0, 0, 1, 1);
        this.main.attach(apiKey, 2, 0, 2, 1);
        this.main.attach(howToButtonApiKey, 4, 0, 1, 1);

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
