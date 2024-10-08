/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

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

import {convertMD} from './md2pango.js';
import {generateAPIKey} from './auth.js';

let GEMINIAPIKEY = '';
let GOOGLEAPIKEY = '';
let DRIVEFOLDER = '';
let VERTEXPROJECTID = '';
let LOCATION = '';
let USERNAME = GLib.get_real_name();
let RECURSIVETALK = false;
let ISVERTEX = false;
let LASTQUESTIONFILE = 'lastQuestion.wav';

// Log function
function log(message) {
    if (message) {
        console.log(message);
    }
}

// Variáveis globais para controle do pipeline e do estado de gravação
let pipeline;
let isRecording = false;

const Gemini = GObject.registerClass(
    class Gemini extends PanelMenu.Button {
        _loadSettings() {
            this._settingsChangedId = this.extension.settings.connect(
                'changed',
                () => {
                    this._fetchSettings();
                    this._initFirstResponse();
                },
            );
            this._fetchSettings();
        }

        _initFirstResponse() {
            if (ISVERTEX) {
                this.chatTune = this.getTuneString();
                this.getAireponse(undefined, this.chatTune);
                this.afterTune = setTimeout(() => {
                    this.getAireponse(undefined, 'Hi!', undefined, true);
                }, 1500);
            }
        }

        _fetchSettings() {
            const {settings} = this.extension;
            GEMINIAPIKEY = settings.get_string('gemini-api-key');
            GOOGLEAPIKEY = settings.get_string('google-api-key');
            DRIVEFOLDER = settings.get_string('drive-folder');
            VERTEXPROJECTID = settings.get_string('vertex-project-id');
            RECURSIVETALK = settings.get_boolean('log-history');
            ISVERTEX = settings.get_boolean('vertex-enabled');
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
            this._initFirstResponse();
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
                // Change searchEntry text to 'Listening...'
                // Notify listening...
                this.stopRecording();
                return;
            }
            this.executeCommand(
                "notify-send -a 'Gemini Voice Assist' 'Listening...'",
            );

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

            // Encerra o pipeline
            pipeline.force_exit();
            isRecording = false;

            // Transcribe audio
            this.transcribeAudio(LASTQUESTIONFILE);
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

        getAireponse(
            inputItem,
            question,
            newKey = undefined,
            destroyLoop = false,
        ) {
            if (destroyLoop) {
                this.destroyLoop();
            }
            let _httpSession = new Soup.Session();
            let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINIAPIKEY}`;
            if (VERTEXPROJECTID !== '' && ISVERTEX) {
                url = `https://us-east4-aiplatform.googleapis.com/v1/projects/${VERTEXPROJECTID}/locations/us-east4/publishers/google/models/gemini-1.0-pro:generateContent`;
            }
            if (newKey !== undefined) {
                this.extension.settings.set_string('gemini-api-key', newKey);
                GEMINIAPIKEY = newKey;
            }
            var body = this.buildBody(question);
            let message = Soup.Message.new('POST', url);
            let bytes = GLib.Bytes.new(body);
            if (VERTEXPROJECTID !== '' && ISVERTEX) {
                message.request_headers.append(
                    'Authorization',
                    `Bearer ${GEMINIAPIKEY}`,
                );
            }
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
                    if (
                        res.error?.code === 401 &&
                        newKey === undefined &&
                        ISVERTEX
                    ) {
                        this.keyLoopBind++;
                        if (this.keyLoopBind < 3) {
                            let key = generateAPIKey();
                            this.getAireponse(inputItem, question, key);
                        }
                    } else {
                        let aiResponse =
                            res.candidates[0]?.content?.parts[0]?.text;
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
                            inputItem.label.clutter_text.set_markup(
                                htmlResponse,
                            );
                        }
                    }
                },
            );
        }

        getTuneString() {
            const date = new Date();
            // PLEASE DO NOT TRANSLATE FINE TUNE BECAUSE
            // VERTEX SOMETIMES DOESNT SUPPORT INTERNET CONNECTION
            //  IF YOU TRANSLATE TO ENGLISH
            let driveTune = '';
            if (DRIVEFOLDER !== '') {
                driveTune = `bundan sonraki konuşmalarımızda şu drive klasörünündeki tüm pdf, excel, word, txt dosyalarından yararlan ama önceliğin internet ve kendi modelin olsun: ${DRIVEFOLDER}\n`;
            }
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

        // Função para transcrever o áudio gravado usando Google Speech-to-Text API (não utilizada)
        transcribeAudio(audioFile) {
            const audioPath =
                // eslint-disable-next-line prefer-template
                '.local/share/gnome-shell/extensions/gnome-extension@gemini-assist.vercel.app/' +
                audioFile;

            // Converte o arquivo de áudio para base64
            // eslint-disable-next-line no-undef
            const audioBase64 = encodeFileToBase64(audioPath);
            if (!audioBase64) {
                this.gnomeNotify('Falha ao converter arquivo de áudio.');
                return;
            }

            // Requisição à API do Google Speech-to-Text
            const apiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLEAPIKEY}`;

            const postData = JSON.stringify({
                config: {
                    encoding: 'LINEAR16', // O formato de codificação para arquivos .wav
                    sampleRateHertz: 16000, // Certifique-se de que a taxa de amostragem seja 16kHz ou compatível
                    languageCode: 'pt-BR', // Ajuste para o idioma desejado
                },
                audio: {
                    content: audioBase64, // Arquivo de áudio em base64
                },
            });

            // Usa subprocesso para enviar requisição HTTP com curl
            let subprocess = new Gio.Subprocess({
                argv: [
                    'curl',
                    '-s',
                    '-X',
                    'POST',
                    '-H',
                    'Content-Type: application/json',
                    '-d',
                    postData,
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

                        if (
                            response &&
                            response.results &&
                            response.results.length > 0
                        ) {
                            let transcription =
                                response.results[0].alternatives[0].transcript;
                            // eslint-disable-next-line prefer-template
                            log('Transcrição: ' + transcription);
                            this.gnomeNotify(transcription);
                            this.aiResponse(transcription);
                        } else {
                            this.gnomeNotify('Nenhuma transcrição encontrada.');
                        }
                    } else {
                        // eslint-disable-next-line prefer-template
                        this.gnomeNotify('Erro na requisição: ' + stderr);
                    }
                } catch (e) {
                    // eslint-disable-next-line prefer-template
                    this.gnomeNotify(
                        // eslint-disable-next-line prefer-template
                        'Erro ao processar resposta: ' + e.message,
                    );
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
                this._gemini._initFirstResponse();
            },
        );
    }

    disable() {
        this._gemini.destroy();
        this._gemini = null;
    }
}
