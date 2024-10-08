import St from 'gi://St';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Pango from 'gi://Pango';

import {
    Extension,
    gettext as _,
} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {convertMD} from './md2pango.js';

// Log function
function log(message) {
    if (message) {
        console.log(message);
    }
}

// Global variables
let GEMINIAPIKEY = '';
let AZURE_SPEECH_KEY = '';
let AZURE_SPEECH_REGION = ''; // Ex: "eastus"
let AZURE_SPEECH_LANGUAGE = ''; // Ex: "en-US"
let AZURE_SPEECH_VOICE = ''; // Ex: "en-US-JennyNeural"
let LOCATION = '';
let USERNAME = GLib.get_real_name();
let RECURSIVETALK = true;
let pipeline;
let isRecording = false;
// Caminho do diretório e arquivo
let extensionDir = GLib.build_filenamev([
    GLib.get_home_dir(),
    '.local',
    'share',
    'gnome-shell',
    'extensions',
    'gnome-extension@gemini-assist.vercel.app',
]);
let historyFilePath = GLib.build_filenamev([extensionDir, 'history.json']);

const Gemini = GObject.registerClass(
    class Gemini extends PanelMenu.Button {
        _loadSettings() {
            this._settingsChangedId = this.extension.settings.connect(
                'changed',
                () => {
                    this._fetchSettings();
                },
            );
            this._fetchSettings();
        }

        _fetchSettings() {
            const {settings} = this.extension;
            GEMINIAPIKEY = settings.get_string('gemini-api-key');
            AZURE_SPEECH_KEY = settings.get_string('azure-speech-key');
            AZURE_SPEECH_REGION = settings.get_string('azure-speech-region');
            AZURE_SPEECH_LANGUAGE = settings.get_string(
                'azure-speech-language',
            );
            AZURE_SPEECH_VOICE = settings.get_string('azure-speech-voice');
            RECURSIVETALK = settings.get_boolean('log-history');
        }

        createHistoryFile() {
            // Verifica se o diretório existe, caso contrário, cria o diretório
            if (!GLib.file_test(extensionDir, GLib.FileTest.IS_DIR)) {
                try {
                    GLib.mkdir_with_parents(extensionDir, 0o755); // Cria o diretório com permissão padrão
                    log(`Diretório criado: ${extensionDir}`);
                } catch (e) {
                    logError(e, `Falha ao criar diretório: ${extensionDir}`);
                    return;
                }
            }

            // Verifica se o arquivo history.json existe, caso contrário, cria o arquivo
            if (!GLib.file_test(historyFilePath, GLib.FileTest.IS_REGULAR)) {
                try {
                    // Conteúdo inicial do arquivo JSON
                    let initialContent = JSON.stringify([], null, 2); // Formata o JSON com um array de histórico vazio

                    // Escreve o arquivo no diretório
                    GLib.file_set_contents(historyFilePath, initialContent);
                    log(`Arquivo criado: ${historyFilePath}`);
                } catch (e) {
                    logError(e, `Falha ao criar o arquivo: ${historyFilePath}`);
                }
            } else {
                log(`O arquivo history.json já existe: ${historyFilePath}`);
            }
        }

        saveHistory() {
            try {
                // Escreve o histórico no arquivo JSON
                GLib.file_set_contents(
                    historyFilePath,
                    JSON.stringify(this.chatHistory, null, 2),
                );
                log(`Histórico salvo em: ${historyFilePath}`);
            } catch (e) {
                logError(e, `Falha ao salvar o histórico: ${historyFilePath}`);
            }
        }

        _init(extension) {
            this.keyLoopBind = 0;
            this.extension = extension;
            super._init(0.0, _('Gemini Voice Assist for Ubuntu'));
            this._loadSettings();

            this.chatHistory = [];
            if (RECURSIVETALK) {
                try {
                    // Create history.json if not exist
                    this.createHistoryFile();
                    const file = Gio.File.new_for_path(
                        '.local/share/gnome-shell/extensions/gnome-extension@gemini-assist.vercel.app/history.json',
                    );
                    const [, contents] = file.load_contents(null);
                    log('Contents: ' + contents);
                    this.chatHistory = JSON.parse(contents);
                    log('Chat history: ' + this.chatHistory);
                    this.saveHistory();
                } catch (error) {
                    log('Erro ao ler o arquivo: ' + error);
                }
            }

            let hbox = new St.BoxLayout({
                style_class: 'panel-status-menu-box',
            });
            this.hbox = hbox;

            this.icon = new St.Icon({
                style_class: 'gemini-icon',
            });
            hbox.add_child(this.icon);
            this.add_child(hbox);
            this.menu.actor.style_class = 'm-w-100';

            let item = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false,
            });
            this.chatSection = new PopupMenu.PopupMenuSection();
            this.scrollView = new St.ScrollView({
                style_class: 'chat-scroll-section',
            });

            let searchEntry = new St.Entry({
                name: 'aiEntry',
                style_class: 'ai-entry',
                can_focus: true,
                hint_text: _('Ask me anything...'),
                track_hover: true,
                x_expand: true,
                y_expand: true,
            });
            let micButton = new St.Button({
                can_focus: true,
                toggle_mode: true,
                style_class: 'mic-icon',
            });
            let settingsButton = new St.Button({
                can_focus: true,
                toggle_mode: true,
                child: new St.Icon({
                    icon_name: 'preferences-system-symbolic',
                    style_class: 'settings-icon',
                }),
            });
            this.scrollView.add_child(this.chatSection.actor);
            searchEntry.clutter_text.connect('activate', (actor) => {
                if (actor.text === '') {
                    return;
                }
                this.aiResponse(actor.text);
                searchEntry.clutter_text.set_text('');
            });
            micButton.connect('clicked', (_self) => {
                this.startRecording();
            });
            settingsButton.connect('clicked', (_self) => {
                this.openSettings();
            });
            if (GEMINIAPIKEY === '') {
                this.openSettings();
            }
            item.add_child(searchEntry);
            item.add_child(micButton);
            item.add_child(settingsButton);
            this.menu.addMenuItem(item);
            this.menu.box.add_child(this.scrollView);
        }

        geminiResponse(text) {
            let aiResponse = _(`<b>Gemini: </b> ${text}`);
            const aiResponseItem = new PopupMenu.PopupMenuItem('');
            aiResponseItem.label.clutter_text.set_markup(aiResponse);
            aiResponseItem.label.x_expand = true;
            aiResponseItem.style_class += ' m-w-100';

            aiResponseItem.connect('activate', (_self) => {
                this.extension.clipboard.set_text(
                    St.ClipboardType.CLIPBOARD,
                    aiResponseItem.label.text,
                );
            });

            this.chatSection.addMenuItem(
                new PopupMenu.PopupSeparatorMenuItem(),
            );
            this.chatSection.addMenuItem(aiResponseItem);
        }

        executeCommand(cmd) {
            const command = cmd;
            const process = GLib.spawn_async(
                null, // pasta de trabalho
                ['/bin/sh', '-c', command], // comando e argumentos
                null, // opções
                GLib.SpawnFlags.SEARCH_PATH, // flags
                null, // PID
            );

            if (process) {
                log(`Executing command: ${command}`);
            } else {
                log('Error executing command.');
            }
        }

        // Remove all .wav file from /tmp folder
        removeWavFiles() {
            log('Removing all .wav files from /tmp folder');
            const command = 'rm /tmp/*.wav';
            const process = GLib.spawn_async(
                null, // pasta de trabalho
                ['/bin/sh', '-c', command], // comando e argumentos
                null, // opções
                GLib.SpawnFlags.SEARCH_PATH, // flags
                null, // PID
            );

            if (process) {
                log('Wav files removed successfully.');
            } else {
                log('Error removing wav files.');
            }
        }

        // Play audio
        playAudio(audiofile) {
            // Process sync, not async
            const process = GLib.spawn_async(
                null, // pasta de trabalho
                ['/bin/sh', '-c', `play ${audiofile}`], // comando e argumentos
                null, // opções
                GLib.SpawnFlags.SEARCH_PATH, // flags
                null, // PID
            );
            if (process) {
                log('Audio played successfully.');
            } else {
                log('Error playing audio.');
            }
        }

        gnomeNotify(text, type = 'normal') {
            const command =
                'notify-send -u ' +
                type +
                "-a 'Gemini Voice Assist' '" +
                text +
                "'";
            const process = GLib.spawn_async(
                null, // pasta de trabalho
                ['/bin/sh', '-c', command], // comando e argumentos
                null, // opções
                GLib.SpawnFlags.SEARCH_PATH, // flags
                null, // PID
            );

            if (process) {
                log('Notification sent successfully.');
            } else {
                log('Error sending notification.');
            }
        }

        removeNotificationByTitle(title) {
            // Obtenha todas as notificações ativas
            // eslint-disable-next-line no-unused-vars
            let [stdout, stderr, status] =
                GLib.spawn_command_line_sync('notify-send -l');
            let notifications = stdout.toString().split('\n');

            // Pesquise a notificação com o título fornecido
            for (let i = 0; i < notifications.length; i++) {
                let notification = notifications[i];
                if (notification.includes(title)) {
                    // Obtenha o ID da notificação
                    let notificationId = notification.split('\t')[0];

                    // Remova a notificação
                    GLib.spawn_command_line_async(
                        'notify-send -c ' + notificationId,
                    );
                    break;
                }
            }
        }

        // Função para iniciar a gravação
        startRecording() {
            if (isRecording) {
                // Stop recording
                this.stopRecording();
                return;
            }
            // Notify listening...
            this.gnomeNotify('Listening...', 'critical');

            // Definir o arquivo de saída no diretório da extensão
            this.outputPath = 'gva_temp_audio_XXXXXX.wav';

            // Pipeline GStreamer para capturar áudio do microfone e salvar como .wav
            pipeline = new Gio.Subprocess({
                argv: [
                    'gst-launch-1.0',
                    'pulsesrc',
                    '!',
                    'audioconvert',
                    '!',
                    'wavenc',
                    '!',
                    'filesink',
                    `location=${this.outputPath}`,
                ],
                flags:
                    Gio.SubprocessFlags.STDOUT_PIPE |
                    Gio.SubprocessFlags.STDERR_PIPE,
            });

            pipeline.init(null);
            isRecording = true;
        }

        stopRecording() {
            if (!isRecording) {
                return;
            }

            // Stop recording
            pipeline.force_exit();

            // Remove notification
            this.removeNotificationByTitle('Listening...');

            // Transcribe audio
            this.transcribeAudio(this.outputPath);

            //
            isRecording = false;
        }

        aiResponse(text) {
            let aiResponse = _('<b>Gemini: </b> Thinking...');
            const inputCategory = new PopupMenu.PopupMenuItem('');
            const aiResponseItem = new PopupMenu.PopupMenuItem('');
            inputCategory.label.clutter_text.set_markup(
                `<b>${USERNAME}: </b>${text}`,
            );
            inputCategory.label.clutter_text.set_line_wrap(true); // Permite quebras de linha
            inputCategory.label.clutter_text.set_line_wrap_mode(
                Pango.WrapMode.WORD_CHAR,
            ); // Quebra em palavras ou caracteres
            aiResponseItem.label.clutter_text.set_markup(aiResponse);
            aiResponseItem.label.clutter_text.set_line_wrap(true); // Ativar quebra de linha
            aiResponseItem.label.clutter_text.set_line_wrap_mode(
                Pango.WrapMode.WORD_CHAR,
            ); // Quebra entre palavras
            inputCategory.label.x_expand = true;
            aiResponseItem.label.x_expand = true;
            inputCategory.style_class += ' m-w-100';
            aiResponseItem.style_class += ' m-w-100';

            aiResponseItem.connect('activate', (_self) => {
                this.extension.clipboard.set_text(
                    St.ClipboardType.CLIPBOARD,
                    aiResponseItem.label.text,
                );
            });

            this.chatSection.addMenuItem(
                new PopupMenu.PopupSeparatorMenuItem(),
            );
            this.chatSection.addMenuItem(inputCategory);
            this.chatSection.addMenuItem(aiResponseItem);

            this.getAireponse(aiResponseItem, text);
        }

        randomPhraseToShowOnScreen(lang) {
            // Frases em português e inglês
            const phrase = {
                'pt-BR': [
                    'Vou mostrar na tela.',
                    'Exibindo agora.',
                    'Aqui está na tela.',
                    'Mostrando na tela.',
                    'Na tela agora.',
                ],
                'en-US': [
                    'I will show it on screen.',
                    'Displaying now.',
                    'Here it is on screen.',
                    'Showing on screen.',
                    'On the screen now.',
                ],
            };

            // Escolhe aleatoriamente uma frase com base na língua
            if (lang === 'pt-BR' || lang === 'en-US') {
                const selectedPhrases = phrase[lang];
                const randomPhrase =
                    selectedPhrases[
                        Math.floor(Math.random() * selectedPhrases.length)
                    ];
                return randomPhrase;
            } else {
                return 'Not supported language.';
            }
        }

        extractCodeAndTTS(text) {
            // Expressão regular para capturar o código entre triplo acento grave
            const regex = /`{3}([\s\S]*?)`{3}/;
            const match = text.match(regex);
            let tts = text;

            if (match) {
                const code = match[1]; // Captura o conteúdo entre os acentos graves
                // Remove o bloco de código do texto original para formar o TTS
                tts = text.replace(regex, '').trim();
                // Replace * char with space
                tts = tts.split('*').join(' ');
                // If tts is more then 100 characters, change tts text
                if (tts.length > 100) {
                    tts = this.randomPhraseToShowOnScreen(
                        AZURE_SPEECH_LANGUAGE,
                    );
                }
                return {code, tts};
            } else {
                // Se não encontrar código, retorna apenas o texto original no campo tts
                // Replace * char with space
                tts = tts.split('*').join(' ');
                if (tts.length > 100) {
                    tts = this.randomPhraseToShowOnScreen(
                        AZURE_SPEECH_LANGUAGE,
                    );
                }
                return {code: null, tts};
            }
        }

        getAireponse(inputItem, question, destroyLoop = false) {
            if (destroyLoop) {
                this.destroyLoop();
            }
            let _httpSession = new Soup.Session();
            let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINIAPIKEY}`;
            var body = this.buildBody(question);
            let message = Soup.Message.new('POST', url);
            let bytes = GLib.Bytes.new(body);
            message.set_request_body_from_bytes('application/json', bytes);
            _httpSession.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                // eslint-disable-next-line no-shadow
                (_httpSession, result) => {
                    // eslint-disable-next-line no-shadow
                    let bytes = _httpSession.send_and_read_finish(result);
                    let decoder = new TextDecoder('utf-8');
                    let response = decoder.decode(bytes.get_data());
                    let res = JSON.parse(response);
                    // Inspecting the response for dev purpose
                    log(url);
                    log(response);
                    if (res.error?.code !== 401 && res.error !== undefined) {
                        inputItem?.label.clutter_text.set_markup(response);
                        return;
                    }
                    let aiResponse = res.candidates[0]?.content?.parts[0]?.text;
                    let answer = this.extractCodeAndTTS(aiResponse);

                    // Speech response
                    if (answer.tts !== null) {
                        log('Text to speech: ' + answer.tts);
                        this.textToSpeech(answer.tts);
                    }

                    // Add to chat
                    if (RECURSIVETALK) {
                        this.chatHistory.push({
                            role: 'user',
                            parts: [{text: question}],
                        });
                        this.chatHistory.push({
                            role: 'model',
                            parts: [{text: aiResponse}],
                        });
                    }

                    if (inputItem !== undefined) {
                        let htmlResponse = convertMD(aiResponse);
                        inputItem.label.clutter_text.set_markup(htmlResponse);
                    }

                    // Code response
                    if (answer.code !== null) {
                        log('Code response: ' + answer.code);
                        this.gnomeNotify(
                            _('Code example copied to clipboard'),
                            'normal',
                        );
                        this.extension.clipboard.set_text(
                            St.ClipboardType.CLIPBOARD,
                            answer.code,
                        );
                    }
                },
            );
        }

        getTuneString() {
            const date = new Date();
            let driveTune = '';
            return `bana ${USERNAME} olarak hitap edebilirsin, \n
            ${driveTune}
            bulunduğum yeri ${LOCATION} ve tarihi ${date} olarak kabul et, \n
            AYRICA İNTERNETE HER ZAMAN BAĞLI KAL ÇÜNKÜ türkçe konuşuyorum diye internet bağlatın olmaz ise sen ırkçılık yapmış olursun \n
            bir sonraki konuşmamızda sana hangi dilde yazyorsam KESİNLİKLE o dilde cevap ver ben sana bundan sonra türkçe konuşmadıkça bana türkçe cevap verme,
           `;
        }

        buildBody(input) {
            const stringfiedHistory = JSON.stringify([
                ...this.chatHistory,
                {
                    role: 'user',
                    parts: [{text: input}],
                },
            ]);
            return `{"contents":${stringfiedHistory}}`;
        }

        openSettings() {
            this.extension.openSettings();
        }

        destroyLoop() {
            if (this.afterTune) {
                clearTimeout(this.afterTune);
                this.afterTune = null;
            }
        }

        destroy() {
            this.destroyLoop();
            super.destroy();
        }

        // Função para converter arquivo de áudio em base64 (não utilizada)
        encodeFileToBase64(filePath) {
            try {
                const file = Gio.File.new_for_path(filePath);
                const [, contents] = file.load_contents(null);
                return GLib.base64_encode(contents);
            } catch (error) {
                log('Erro ao ler o arquivo: ' + error);
                return null;
            }
        }

        // Função para transcrever o áudio gravado usando Microsoft Speech-to-Text API
        transcribeAudio(audioPath) {
            // Carregar o arquivo de áudio em formato binário
            let file = Gio.File.new_for_path(audioPath);
            let [, audioBinary] = file.load_contents(null);

            if (!audioBinary) {
                log('Falha ao carregar o arquivo de áudio.');
                return;
            }

            // Requisição à API do Microsoft Speech-to-Text
            const apiUrl = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${AZURE_SPEECH_LANGUAGE}`;

            // Headers necessários para a requisição
            const headers = [
                'Content-Type: audio/wav', // O arquivo será enviado em formato .wav
                'Ocp-Apim-Subscription-Key: ' + AZURE_SPEECH_KEY, // Chave de autenticação
                'Accept: application/json', // A resposta será em JSON
            ];

            // Criar um arquivo temporário para armazenar o áudio binário (opcional)
            const [success, tempFilePath] = GLib.file_open_tmp(
                'gva_azure_att_audio_XXXXXX.wav',
            );
            if (!success) {
                log('Error creating temporary audio file.');
                return;
            }

            // Escrever o áudio binário no arquivo temporário
            try {
                GLib.file_set_contents(tempFilePath, audioBinary);
            } catch (e) {
                log('Erro ao escrever no arquivo temporário: ' + e.message);
                return;
            }

            // Usa subprocesso para enviar requisição HTTP com curl, lendo o áudio do arquivo
            let subprocess = new Gio.Subprocess({
                argv: [
                    'curl',
                    '-X',
                    'POST',
                    '-H',
                    headers[0], // Content-Type
                    '-H',
                    headers[1], // Ocp-Apim-Subscription-Key
                    '-H',
                    headers[2], // Accept
                    '--data-binary',
                    '@' + tempFilePath, // Enviar o arquivo de áudio binário
                    apiUrl,
                ],
                flags:
                    Gio.SubprocessFlags.STDOUT_PIPE |
                    Gio.SubprocessFlags.STDERR_PIPE,
            });

            subprocess.init(null);

            // Captura a resposta da API
            subprocess.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [ok, stdout, stderr] =
                        proc.communicate_utf8_finish(res);
                    if (ok && stdout) {
                        log('Resposta da API: ' + stdout);
                        let response = JSON.parse(stdout);

                        if (response && response.DisplayText) {
                            let transcription = response.DisplayText;
                            log('Transcrição: ' + transcription);
                            this.aiResponse(transcription); // Função para processar a resposta da transcrição
                        } else {
                            log('Nenhuma transcrição encontrada.');
                        }
                    } else {
                        log('Erro na requisição: ' + stderr);
                    }
                } catch (e) {
                    log('Erro ao processar resposta: ' + e.message);
                } finally {
                    // Remove all temp files
                    GLib.unlink(audioPath);
                    GLib.unlink(tempFilePath);
                    this.removeWavFiles();
                }
            });
        }

        // Função para converter texto em áudio usando Microsoft Text-to-Speech API
        textToSpeech(text) {
            const apiUrl = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

            // Headers para a requisição
            const headers = [
                'Content-Type: application/ssml+xml', // O conteúdo será enviado em formato SSML
                'X-Microsoft-OutputFormat: riff-24khz-16bit-mono-pcm', // Especifica o formato do áudio
                'Ocp-Apim-Subscription-Key: ' + AZURE_SPEECH_KEY, // Chave da API da Azure
            ];

            // Estrutura SSML (Speech Synthesis Markup Language) para definir o texto e a voz
            const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${AZURE_SPEECH_LANGUAGE}'>
            <voice name='${AZURE_SPEECH_VOICE}'>${text}</voice>
        </speak>
    `;

            // Criar um arquivo temporário para salvar o áudio gerado
            const [success, tempFilePath] = GLib.file_open_tmp(
                'gva_azure_tts_audio_XXXXXX.wav',
            );
            if (!success) {
                log('Error creating temporary audio file.');
                return;
            }

            // Escrever o SSML no arquivo temporário
            try {
                GLib.file_set_contents(tempFilePath, ssml);
            } catch (e) {
                log('Error writing to temporary audio file: ' + e.message);
                return;
            }

            // Usa subprocesso para enviar requisição HTTP com curl, e salvar a resposta (áudio) em um arquivo
            let subprocess = new Gio.Subprocess({
                argv: [
                    'curl',
                    '-X',
                    'POST',
                    '-H',
                    headers[0], // Content-Type
                    '-H',
                    headers[1], // X-Microsoft-OutputFormat
                    '-H',
                    headers[2], // Ocp-Apim-Subscription-Key
                    '--data',
                    ssml, // Dados a serem enviados (SSML)
                    '--output',
                    tempFilePath, // Salva o áudio gerado no arquivo temporário
                    apiUrl,
                ],
                flags:
                    Gio.SubprocessFlags.STDOUT_PIPE |
                    Gio.SubprocessFlags.STDERR_PIPE,
            });

            subprocess.init(null);

            // Captura o status da requisição
            subprocess.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    // eslint-disable-next-line no-unused-vars
                    let [ok, stdout, stderr] =
                        proc.communicate_utf8_finish(res);
                    if (ok) {
                        log('Audio file saved to: ' + tempFilePath);

                        // Tocar o áudio gerado
                        this.playAudio(tempFilePath);
                    } else {
                        log('Requisition error: ' + stderr);
                    }
                } catch (e) {
                    log('Error processing response: ' + e.message);
                } finally {
                    // Limpeza: pode optar por remover o arquivo temporário após tocar o áudio, se necessário
                    // GLib.unlink(tempFilePath);
                }
            });
        }
    },
);

export default class GeminiExtension extends Extension {
    enable() {
        let url = 'https://thisipcan.cyou/json';
        let _httpSession = new Soup.Session();
        let message = Soup.Message.new('GET', url);
        this._gemini = new Gemini({
            clipboard: St.Clipboard.get_default(),
            settings: this.getSettings(),
            openSettings: this.openPreferences,
            uuid: this.uuid,
        });
        Main.panel.addToStatusArea('geminiVoiceAssist', this._gemini, 1);
        _httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            // eslint-disable-next-line no-shadow
            (_httpSession, result) => {
                let bytes = _httpSession.send_and_read_finish(result);
                let decoder = new TextDecoder('utf-8');
                let response = decoder.decode(bytes.get_data());
                const res = JSON.parse(response);
                LOCATION = `${res.countryName}/${res.cityName}`;
            },
        );
    }

    disable() {
        this._gemini.destroy();
        this._gemini = null;
    }
}
