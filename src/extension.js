import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import {St, Clutter} from 'gi://St'; // Importa o módulo St
import {Meta} from 'gi://Meta'; // Importa o módulo Meta
import {Shell} from 'gi://Shell'; // Importa o módulo Shell

// Variável para armazenar o ID da ligação de tecla F1
let f1BindingId = null;

import {
    Extension,
    gettext as _,
} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {convertMD} from './md2pango.js';

let GEMINIAPIKEY = '';
let AZURE_SPEECH_KEY = '';
let AZURE_SPEECH_REGION = ''; // Ex: "eastus"
let AZURE_SPEECH_LANGUAGE = ''; // Ex: "en-US"
let AZURE_SPEECH_VOICE = ''; // Ex: "en-US-JennyNeural"
let VOICE_ACTIVATION_KEY = 'F8';
let LOCATION = '';
let USERNAME = GLib.get_real_name();
let RECURSIVETALK = true;
let LASTQUESTIONFILE = 'lastQuestion.wav';

// Log function
function log(message) {
    if (message) {
        console.log(message);
    }
}

// Global variables for pipeline control
let pipeline;
let isRecording = false;

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

        _init(extension) {
            this.keyLoopBind = 0;
            this.extension = extension;
            super._init(0.0, _('Gemini Voice Assist for Ubuntu'));
            this._loadSettings();
            this.chatHistory = [];
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
                this.aiResponse(actor.text);
                searchEntry.clutter_text.set_text('');
            });
            micButton.connect('clicked', (_self) => {
                this.startRecording(LASTQUESTIONFILE);
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

        // Função que será executada quando a tecla configurada for pressionada
        onKeyPressed(key) {
            log(`Key pressed: ${key}`);
            // Adicione aqui a função que deseja executar
            // Exemplo: this.textToSpeech('Olá, isso é um teste de F1!');
        }

        // Registrar o atalho da tecla configurada
        registerKeybinding(key) {
            f1BindingId = global.display.add_keybinding(
                `${key}-keybinding`, // Nome do atalho (deve ser único)
                new Gio.Settings({schema: 'org.gnome.desktop.wm.keybindings'}), // Configurações de teclado do GNOME
                Meta.KeyBindingFlags.NONE, // Sem flags adicionais
                Shell.ActionMode.ALL, // Atalho disponível em todos os modos
                () => {
                    // Função callback para ser executada ao pressionar a tecla configurada
                    this.onKeyPressed(key);
                },
            );
        }

        // Remover o atalho da tecla F1
        unregisterKeybinding(key) {
            if (f1BindingId) {
                global.display.remove_keybinding(`${key}-keybinding`);
                log(`Keybinding ${key}`);
                f1BindingId = null;
            }
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

            if (process[0] === 0) {
                log('Notificação enviada com sucesso.');
            } else {
                log('Erro ao enviar notificação.');
            }
        }

        gnomeNotify(text) {
            const command =
                // eslint-disable-next-line prefer-template
                "notify-send -a 'Gemini Voice Assist' '" + text + "'";
            const process = GLib.spawn_async(
                null, // pasta de trabalho
                ['/bin/sh', '-c', command], // comando e argumentos
                null, // opções
                GLib.SpawnFlags.SEARCH_PATH, // flags
                null, // PID
            );

            if (process[0] === 0) {
                log('Notificação enviada com sucesso.');
            } else {
                log('Erro ao enviar notificação.');
            }
        }

        // Função para iniciar a gravação
        startRecording(outputFile) {
            if (isRecording) {
                // Stop recording
                this.stopRecording();
                return;
            }
            // Notify listening...
            this.gnomeNotify('Listening...');

            // Definir o arquivo de saída no diretório da extensão
            const outputPath =
                // eslint-disable-next-line prefer-template
                '.local/share/gnome-shell/extensions/gnome-extension@gemini-assist.vercel.app/' +
                outputFile;

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
                    `location=${outputPath}`,
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

            // Transcribe audio
            this.transcribeAudio(LASTQUESTIONFILE);

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
            aiResponseItem.label.clutter_text.set_markup(aiResponse);
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

        extractCodeFromText() {
            const regex = /`{3}([\s\S]*?)`{3}/;
            const matches = this.answer.match(regex);

            if (matches) {
                const textoExtraido = matches[1];
                const textoRestante = this.answer.replace(regex, '');
                return {textoExtraido, textoRestante};
            } else {
                return {textoExtraido: null, textoRestante: this.answer};
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

                    let answer = this.extractCodeFromText(aiResponse);

                    // Speech response
                    if (answer.textoRestante !== null) {
                        this.textToSpeech(answer.textoRestante);
                    }

                    let codeName = 'Desconhecido';
                    let codeExample = '';
                    let codeResult = this.extractCodeFromText().textoExtraido;
                    if (codeResult) {
                        codeName = codeResult.split('\n')[0];
                        codeExample = codeResult.substring(
                            codeResult.indexOf('\n') + 1,
                        );
                    }

                    // Notify gnome
                    // eslint-disable-next-line prefer-template
                    const titulo = 'Exemplo de Código ' + codeName;

                    // If answer has code, show in gnome window
                    if (codeExample !== undefined) {
                        if (codeExample.length > 0) {
                            const gnomeWindow =
                                '.local/share/gnome-shell/extensions/gnome-extension@gemini-assist.vercel.app/gnome-window.py';
                            this.executeCommand(
                                // eslint-disable-next-line prefer-template
                                'python3 ' +
                                    gnomeWindow +
                                    ' ' +
                                    titulo +
                                    ' ' +
                                    codeExample,
                            );
                        }
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
                // eslint-disable-next-line prefer-template
                log('Erro ao ler o arquivo: ' + error);
                return null;
            }
        }

        // Função para transcrever o áudio gravado usando Microsoft Speech-to-Text API
        transcribeAudio(audioFile) {
            const audioPath =
                // eslint-disable-next-line prefer-template
                '.local/share/gnome-shell/extensions/gnome-extension@gemini-assist.vercel.app/' +
                audioFile;

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
                // eslint-disable-next-line prefer-template
                'Ocp-Apim-Subscription-Key: ' + AZURE_SPEECH_KEY, // Chave de autenticação
                'Accept: application/json', // A resposta será em JSON
            ];

            // Criar um arquivo temporário para armazenar o áudio binário (opcional)
            const [success, tempFilePath] = GLib.file_open_tmp(
                'azure_speech_audio_XXXXXX.wav',
            );
            if (!success) {
                log('Falha ao criar arquivo temporário.');
                return;
            }

            // Escrever o áudio binário no arquivo temporário
            try {
                GLib.file_set_contents(tempFilePath, audioBinary);
            } catch (e) {
                // eslint-disable-next-line prefer-template
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
                    // eslint-disable-next-line prefer-template
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
                        // eslint-disable-next-line prefer-template
                        log('Resposta da API: ' + stdout);
                        let response = JSON.parse(stdout);

                        if (response && response.DisplayText) {
                            let transcription = response.DisplayText;
                            // eslint-disable-next-line prefer-template
                            log('Transcrição: ' + transcription);
                            this.aiResponse(transcription); // Função para processar a resposta da transcrição
                        } else {
                            log('Nenhuma transcrição encontrada.');
                        }
                    } else {
                        // eslint-disable-next-line prefer-template
                        log('Erro na requisição: ' + stderr);
                    }
                } catch (e) {
                    // eslint-disable-next-line prefer-template
                    log('Erro ao processar resposta: ' + e.message);
                } finally {
                    // Remover o arquivo temporário após a requisição
                    GLib.unlink(tempFilePath);
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
                // eslint-disable-next-line prefer-template
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
                'azure_tts_audio_XXXXXX.wav',
            );
            if (!success) {
                log('Falha ao criar arquivo temporário para áudio.');
                return;
            }

            // Escrever o SSML no arquivo temporário
            try {
                GLib.file_set_contents(tempFilePath, ssml);
            } catch (e) {
                // eslint-disable-next-line prefer-template
                log('Erro ao escrever no arquivo temporário: ' + e.message);
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
                    let [ok, stdout, stderr] =
                        proc.communicate_utf8_finish(res);
                    if (ok) {
                        log('Áudio gerado com sucesso.');
                        log(stdout);

                        // Tocar o áudio gerado
                        // eslint-disable-next-line prefer-template
                        this.executeCommand('play ' + tempFilePath);
                    } else {
                        // eslint-disable-next-line prefer-template
                        log('Erro na requisição: ' + stderr);
                    }
                } catch (e) {
                    // eslint-disable-next-line prefer-template
                    log('Erro ao processar resposta: ' + e.message);
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
        this.registerKeybinding(VOICE_ACTIVATION_KEY);
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
        this.unregisterKeybinding(VOICE_ACTIVATION_KEY);
        this._gemini.destroy();
        this._gemini = null;
    }
}
