import St from 'gi://St';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {
    Extension,
    gettext as _,
} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Utils} from './utils/utils.js';
import {AppLayout} from './ui.js';

// Global variables
let pipeline;
let isRecording = false;
let isPlaying = false;
let playingPid = null;
let extensionDir = GLib.build_filenamev([
    GLib.get_home_dir(),
    '.local',
    'share',
    'gnome-shell',
    'extensions',
    'gnome-extension@gemini-assist.vercel.app',
]);
let historyFilePath = GLib.build_filenamev([extensionDir, 'history.json']);
let utils = new Utils();

// Log function

/**
 *
 * @param {*} message
 */
function log(message) {
    if (message) {
        console.log(`[ DEBUG ] ${message}`);
    }
}

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
            this.settings = {};
            this.settings.GEMINIAPIKEY = settings.get_string('gemini-api-key');
            this.settings.AZURE_SPEECH_KEY =
                settings.get_string('azure-speech-key');
            this.settings.AZURE_SPEECH_REGION = settings.get_string(
                'azure-speech-region',
            );
            this.settings.AZURE_SPEECH_LANGUAGE = settings.get_string(
                'azure-speech-language',
            );
            this.settings.AZURE_SPEECH_VOICE =
                settings.get_string('azure-speech-voice');
            this.settings.RECURSIVETALK = settings.get_boolean('log-history');
            this.settings.USERNAME = GLib.get_real_name();
            this.settings.LOCATION = '';
            this.chatHistory = [];
            this.ui = new AppLayout();
        }

        _init(extension) {
            this.keyLoopBind = 0;
            this.extension = extension;
            super._init(0.0, _('Gemini Voice Assistant for Ubuntu'));
            this._loadSettings();
            if (this.settings.RECURSIVETALK) {
                this.chatHistory = utils.loadHistoryFile();
            }

            // Tray
            this.tray.add_child(this.icon);
            this.add_child(this.tray);

            // Add scroll to chat section
            this.scrollView.add_child(this.chatSection.actor);

            this.searchEntry.clutter_text.connect('activate', (actor) => {
                this.chat(actor.text);
                this.searchEntry.clutter_text.set_text('');
                this.searchEntry.clutter_text.reactive = false;
            });
            this.micButton.connect('clicked', (_self) => {
                this.startRecording();
            });
            this.clearButton.connect('clicked', (_self) => {
                this.searchEntry.clutter_text.set_text('');
                this.chatHistory = [];
                this.menu.box.remove_child(this.scrollView);
                this.chatSection = new PopupMenu.PopupMenuSection();
                this.scrollView.add_child(this.chatSection.actor);
                this.menu.box.add_child(this.scrollView);
            });
            this.settingsButton.connect('clicked', (_self) => {
                this.openSettings();
                // Close App
                this.menu.close();
            });

            // Add search entry, mic button, clear button and settings button to menu
            this.item.add_child(this.searchEntry);
            this.item.add_child(this.micButton);
            this.item.add_child(this.clearButton);
            this.item.add_child(this.settingsButton);

            // Add items to app
            this.menu.addMenuItem(this.item);

            // Add chat section to app
            this.menu.box.add_child(this.scrollView);

            // Open settings if gemini api key is not configured
            if (this.settings.GEMINIAPIKEY === '') {
                this.openSettings();
            }
        }

        chat(userQuestion) {
            // Set temporary message
            let aiResponse = _('<b>Gemini: </b> ...');

            // Enable text selection
            this.inputChat.label.clutter_text.reactive = true;
            this.inputChat.label.clutter_text.selectable = true;

            // Disable clutter_text hover
            this.inputChat.label.clutter_text.hover = false;

            // Add ai response to chat
            this.responseChat.label.clutter_text.set_markup(aiResponse);

            // Enable text selection
            this.responseChat.label.clutter_text.reactive = true;
            this.responseChat.label.clutter_text.selectable = true;

            // Disable clutter_text hover
            this.responseChat.label.clutter_text.hover = false;

            // Chat settings
            this.inputChat.label.x_expand = true;
            this.responseChat.label.x_expand = true;
            this.chatSection.style_class += 'm-w-100';
            this.scrollView.style_class += 'm-w-100';

            // Add user question and ai response to chat
            this.chatSection.addMenuItem(this.newSeparator);
            this.chatSection.addMenuItem(this.inputChat);
            this.chatSection.addMenuItem(this.responseChat);

            // Set mouse click to copy response to clipboard
            this.copyButton.connect('activate', (_self) => {
                this._copySelectedText();
            });

            // Add user question to chat
            let formatedQuestion = utils.inputformat(userQuestion);
            this.inputChat.label.clutter_text.set_markup(
                `<b>${this.settings.USERNAME}: </b>${formatedQuestion}`,
            );

            log(`[ USER ]: ${userQuestion}`);

            // Get ai response for user question
            this.response(userQuestion);

            // DEBUG
            // let debugPhrase =
            //     'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius la';
            // let formatedResponse = convertMD(debugPhrase);
            // formatedResponse = format.chat(formatedResponse);
            // this.typeText(responseChat, formatedResponse);
        }

        response(userQuestion, destroyLoop = false) {
            if (destroyLoop) {
                this.destroyLoop();
            }

            // Scroll down
            this.scrollToBottom();

            // Create http session
            let _httpSession = new Soup.Session();
            let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${this.settings.GEMINIAPIKEY}`;

            // Send async request
            var body = this.buildBody(userQuestion);
            let message = Soup.Message.new('POST', url);
            let bytes = GLib.Bytes.new(body);
            message.set_request_body_from_bytes('application/json', bytes);
            _httpSession.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (_httpSession, result) => {
                    let bytes = _httpSession.send_and_read_finish(result);
                    let decoder = new TextDecoder('utf-8');

                    // Get response
                    let aiResponse = '...';
                    let response = decoder.decode(bytes.get_data());
                    log('[ AI-RES ] ' + response);
                    let res = JSON.parse(response);
                    if (res.error?.code !== 401 && res.error !== undefined) {
                        this.responseChat?.label.clutter_text.set_markup(
                            response,
                        );
                        // Scroll down
                        this.scrollToBottom();
                        // Enable searchEntry
                        this.searchEntry.clutter_text.reactive = true;
                        return;
                    }
                    aiResponse = res.candidates[0]?.content?.parts[0]?.text;
                    // SAFETY warning
                    if (res.candidates[0].finishReason === 'SAFETY') {
                        // get safety reason
                        for (
                            let i = 0;
                            i < res.candidates[0].safetyRatings.length;
                            i++
                        ) {
                            let safetyRating =
                                res.candidates[0].safetyRatings[i];
                            if (safetyRating.probability !== 'NEGLIGIBLE') {
                                if (
                                    safetyRating.category ===
                                    'HARM_CATEGORY_SEXUALLY_EXPLICIT'
                                ) {
                                    aiResponse = _(
                                        "Sorry, I can't answer this question. Possible sexually explicit content in the question or answer.",
                                    );
                                }
                                if (
                                    safetyRating.category ===
                                    'HARM_CATEGORY_HATE_SPEECH'
                                ) {
                                    aiResponse = _(
                                        "Sorry, I can't answer this question. Possible hate speech in the question or answer.",
                                    );
                                }
                                if (
                                    safetyRating.category ===
                                    'HARM_CATEGORY_HARASSMENT'
                                ) {
                                    aiResponse = _(
                                        "Sorry, I can't answer this question. Possible harassment in the question or answer.",
                                    );
                                }
                                if (
                                    safetyRating.category ===
                                    'HARM_CATEGORY_DANGEROUS_CONTENT'
                                ) {
                                    aiResponse = _(
                                        "Sorry, I can't answer this question. Possible dangerous content in the question or answer.",
                                    );
                                }

                                this.responseChat?.label.clutter_text.set_markup(
                                    '<b>Gemini: </b> ' + aiResponse,
                                );

                                // Scroll down
                                this.scrollToBottom();
                                // Enable searchEntry
                                this.searchEntry.clutter_text.reactive = true;
                                return;
                            }
                        }
                    }

                    if (
                        aiResponse !== null &&
                        aiResponse !== undefined &&
                        this.responseChat !== undefined
                    ) {
                        // Set ai response to chat
                        let formatedResponse = utils.textformat(aiResponse);
                        this.responseChat.label.clutter_text.set_markup(
                            '<b>Gemini: </b> ' + formatedResponse,
                        );

                        // Add copy button to chat
                        if (this.copyButton) {
                            this.chatSection.addMenuItem(this.copyButton);
                        }

                        // Scroll down
                        this.scrollToBottom();

                        // Enable searchEntry
                        this.searchEntry.clutter_text.reactive = true;

                        // Extract code and tts from response
                        let answer = utils.extractCodeAndTTS(aiResponse);

                        // Speech response
                        if (answer.tts !== null) {
                            this.textToSpeech(answer.tts);
                        }

                        // If answer.code is not null, copy to clipboard
                        if (answer.code !== null) {
                            this.gnomeNotify(
                                _('Code example copied to clipboard'),
                            );
                            this.extension.clipboard.set_text(
                                St.ClipboardType.CLIPBOARD,
                                answer.code,
                            );
                        }

                        // Add to history
                        if (this.settings.RECURSIVETALK) {
                            this.chatHistory.push({
                                role: 'user',
                                parts: [{text: userQuestion}],
                            });
                            this.chatHistory.push({
                                role: 'model',
                                parts: [{text: aiResponse}],
                            });
                            // Save history.json
                            this.saveHistory();
                        }
                        // Scroll down
                        this.scrollToBottom();
                    }
                },
            );
        }

        scrollToBottom() {
            utils.scrollToBottom(this.responseChat, this.scrollView);
        }

        getTuneString() {
            const date = new Date();
            let driveTune = '';
            return `bana ${this.settings.USERNAME} olarak hitap edebilirsin, \n
        ${driveTune}
        bulunduğum yeri ${this.settings.LOCATION} ve tarihi ${date} olarak kabul et, \n
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

        // Create history.json file if not exist
        createHistoryFile() {
            if (!GLib.file_test(historyFilePath, GLib.FileTest.IS_REGULAR)) {
                try {
                    let initialContent = JSON.stringify([], null, 2);
                    GLib.file_set_contents(historyFilePath, initialContent);
                    this.chatHistory = [];
                    log(`History file created. : ${historyFilePath}`);
                    if (this.settings.RECURSIVETALK) {
                        this.chatHistory.push({
                            role: 'user',
                            parts: [
                                {
                                    text: _('Hi, who are you?'),
                                },
                            ],
                        });
                        this.chatHistory.push({
                            role: 'model',
                            parts: [
                                {
                                    text: _(
                                        'Hi! I am Gemini, your helpfull assistant.',
                                    ),
                                },
                            ],
                        });
                        // Save history.json
                        this.saveHistory();
                    }
                } catch (e) {
                    logError(e, `Failed to create file: ${historyFilePath}`);
                }
            } else {
                log(`The history.json file already exists: ${historyFilePath}`);
            }
        }

        // Save to history file
        saveHistory() {
            try {
                GLib.file_set_contents(
                    historyFilePath,
                    JSON.stringify(this.chatHistory, null, 2),
                );
                log(`History saved in: ${historyFilePath}`);
            } catch (e) {
                logError(e, `Failed to save history: ${historyFilePath}`);
            }
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
            const command = 'rm -rf /tmp/*gva*.wav';
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
            if (!isPlaying) {
                log('Playing audio: ' + audiofile);
                // Process sync, not async
                const process = GLib.spawn_async(
                    null, // pasta de trabalho
                    ['/bin/sh', '-c', `play ${audiofile}`], // comando e argumentos
                    null, // opções
                    GLib.SpawnFlags.SEARCH_PATH, // flags
                    null, // PID
                );
                if (process) {
                    playingPid = process.pid;
                    isPlaying = true;
                    log('Audio played successfully.');
                } else {
                    log('Error playing audio.');
                }
            } else {
                log('Audio already playing.');
                // Kill player pid
                GLib.spawn_command_line_async('kill ' + playingPid);
                isPlaying = false;
                this.playAudio(audiofile);
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

        _copySelectedText() {
            let selectedText =
                this.responseChat.label.clutter_text.get_selection();
            if (selectedText) {
                this.extension.clipboard.set_text(
                    St.ClipboardType.CLIPBOARD,
                    // Get text selection
                    selectedText,
                );
                // Create label
                if (this.copyButton) {
                    this.copyButton.label.clutter_text.set_markup(
                        _('[ Selected Text Copied to clipboard ]'),
                    );
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                        this.copyButton.label.clutter_text.set_markup('');
                        return false; // Para garantir que o timeout execute apenas uma vez
                    });
                }
                log(`Texto copiado: ${selectedText}`);
            } else {
                this.extension.clipboard.set_text(
                    St.ClipboardType.CLIPBOARD,
                    // Get text selection
                    this.responseChat.label.text,
                );
                if (this.copyButton) {
                    this.copyButton.label.clutter_text.set_markup(
                        _('[ Copied to clipboard ]'),
                    );
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                        this.copyButton.label.clutter_text.set_markup('');
                        return false; // Para garantir que o timeout execute apenas uma vez
                    });
                }
                log(`Texto copiado: ${this.responseChat.label.text}`);
            }
        }

        _removeNotificationByTitle(title) {
            // Obtenha todas as notificações ativas
            // eslint-disable-next-line no-unused-vars
            let [stdout, stderr, status] =
                GLib.spawn_command_line_async('notify-send -l');
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
            const apiUrl = `https://${this.settings.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.settings.AZURE_SPEECH_LANGUAGE}`;

            // Headers necessários para a requisição
            const headers = [
                'Content-Type: audio/wav', // O arquivo será enviado em formato .wav
                'Ocp-Apim-Subscription-Key: ' + this.settings.AZURE_SPEECH_KEY, // Chave de autenticação
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
            const apiUrl = `https://${this.settings.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

            // Headers para a requisição
            const headers = [
                'Content-Type: application/ssml+xml', // O conteúdo será enviado em formato SSML
                'X-Microsoft-OutputFormat: riff-24khz-16bit-mono-pcm', // Especifica o formato do áudio
                'Ocp-Apim-Subscription-Key: ' + this.settings.AZURE_SPEECH_KEY, // Chave da API da Azure
            ];

            // Estrutura SSML (Speech Synthesis Markup Language) para definir o texto e a voz
            const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${this.settings.AZURE_SPEECH_LANGUAGE}'>
            <voice name='${this.settings.AZURE_SPEECH_VOICE}'>${text}</voice>
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
        Main.panel.addToStatusArea('gvaGnomeExtension', this._gemini, 1);
        _httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (_httpSession, result) => {
                let bytes = _httpSession.send_and_read_finish(result);
                let decoder = new TextDecoder('utf-8');
                let response = decoder.decode(bytes.get_data());
                const res = JSON.parse(response);
                this.settings.LOCATION = `${res.countryName}/${res.cityName}`;
            },
        );
    }

    disable() {
        this._gemini.destroy();
        this._gemini = null;
    }
}
