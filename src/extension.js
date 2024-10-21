import St from 'gi://St';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';

import {
    Extension,
    gettext as _,
} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Utils} from './utils/utils.js';
import {GoogleGemini} from './ai/gemini.js';
import {Audio} from './utils/audio.js';
import {MicrosoftAzure} from './ai/azure.js';

// Utils
const utils = new Utils();

const Aiva = GObject.registerClass(
    class Aiva extends PanelMenu.Button {
        constructor(props) {
            super(props);
            // API Settings
            this.GEMINIAPIKEY = '';
            this.AZURE_SPEECH_KEY = '';
            this.AZURE_SPEECH_REGION = ''; // Ex: "eastus"
            this.AZURE_SPEECH_LANGUAGE = ''; // Ex: "en-US"
            this.AZURE_SPEECH_VOICE = ''; // Ex: "en-US-JennyNeural"
            this.USERNAME = '';
            this.RECURSIVETALK = true;
            this.ISRECORDING = false;
        }

        /**
         * @description Load settings
         */
        _loadSettings() {
            this._settingsChangedId = this.extension.settings.connect(
                'changed',
                () => {
                    this._fetchSettings();
                },
            );
            this._fetchSettings();
        }

        /**
         * @description Fetch settings
         */
        _fetchSettings() {
            const {settings} = this.extension;
            this.GEMINIAPIKEY = settings.get_string('gemini-api-key');
            this.AZURE_SPEECH_KEY = settings.get_string('azure-speech-key');
            this.AZURE_SPEECH_REGION = settings.get_string(
                'azure-speech-region',
            );
            this.AZURE_SPEECH_LANGUAGE = settings.get_string(
                'azure-speech-language',
            );
            this.AZURE_SPEECH_VOICE = settings.get_string('azure-speech-voice');
            this.RECURSIVETALK = settings.get_boolean('log-history');
            this.USERNAME = GLib.get_real_name();
        }

        /**
         * @param {*} extension
         *
         * @description Initialize extension
         */
        _init(extension) {
            this.keyLoopBind = 0;
            this.extension = extension;
            super._init(0.0, _('Gemini Voice Assistant for Ubuntu'));
            this._loadSettings();
            this.gemini = new GoogleGemini(
                this.GEMINIAPIKEY,
                this.AZURE_SPEECH_KEY,
                this.AZURE_SPEECH_REGION,
                this.AZURE_SPEECH_LANGUAGE,
                this.AZURE_SPEECH_VOICE,
            );
            this.audio = new Audio();
            this.azure = new MicrosoftAzure(
                this.AZURE_SPEECH_KEY,
                this.AZURE_SPEECH_LANGUAGE,
                this.AZURE_SPEECH_VOICE,
            );
            this.chatHistory = [];

            // Create Tray
            let tray = new St.BoxLayout({
                style_class: 'panel-status-menu-box',
            });
            this.tray = tray;
            this.icon = new St.Icon({
                style_class: 'google-gemini-icon',
            });
            tray.add_child(this.icon);
            this.add_child(tray);

            // Create app item section
            let item = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false,
            });

            // Create search entry
            this.searchEntry = new St.Entry({
                name: 'aiEntry',
                style_class: 'ai-entry',
                can_focus: true,
                hint_text: _('Ask me anything...'),
                track_hover: true,
                x_expand: true,
                y_expand: true,
            });

            // Create voice activation button
            let micButton = new St.Button({
                can_focus: true,
                toggle_mode: true,
                style_class: 'mic-icon',
            });

            // Create clear history button
            let clearButton = new St.Button({
                can_focus: true,
                toggle_mode: true,
                style_class: 'trash-icon',
            });

            // Create settings button
            let settingsButton = new St.Button({
                can_focus: true,
                toggle_mode: true,
                style_class: 'settings-icon',
            });

            // Create chat section
            this.chatSection = new PopupMenu.PopupMenuSection({
                style_class: 'chat-section',
                x_expand: true,
                y_expand: true,
            });

            // Create scrollbar
            this.scrollView = new St.ScrollView({
                style_class: 'chat-scroll-section',
                reactive: true,
                overlay_scrollbars: false,
            });

            // Add scroll to chat section
            this.scrollView.add_child(this.chatSection.actor);

            this.searchEntry.clutter_text.connect('activate', (actor) => {
                this.chat(actor.text);
                this.searchEntry.clutter_text.set_text('');
                this.searchEntry.clutter_text.reactive = false;
            });
            micButton.connect('clicked', (_self) => {
                let questionAudio = {success: false, path: null};
                if (!this.ISRECORDING) {
                    questionAudio = this.audio.record();
                } else {
                    this.audio.stopRecord();
                    if (questionAudio.success) {
                        let question = this.azure.transcribe(
                            questionAudio.path,
                        );
                        if (question.success) {
                            this.chat(question.transcription);
                        }
                    }
                }
            });
            clearButton.connect('clicked', (_self) => {
                this.searchEntry.clutter_text.set_text('');
                this.chatHistory = [];
                this.menu.box.remove_child(this.scrollView);
                this.chatSection = new PopupMenu.PopupMenuSection();
                this.scrollView.add_child(this.chatSection.actor);
                this.menu.box.add_child(this.scrollView);
            });
            settingsButton.connect('clicked', (_self) => {
                this.openSettings();
                // Close App
                this.menu.close();
            });

            // Add search entry, mic button, clear button and settings button to menu
            item.add_child(this.searchEntry);
            item.add_child(micButton);
            item.add_child(clearButton);
            item.add_child(settingsButton);

            // Add items to app
            this.menu.addMenuItem(item);

            // Add chat section to app
            this.menu.box.add_child(this.scrollView);

            // Open settings if gemini api key is not configured
            if (this.GEMINIAPIKEY === '') {
                this.openSettings();
            }
        }

        chat(userQuestion) {
            // Create input and response chat items
            const inputChat = new PopupMenu.PopupMenuItem('', {
                style_class: 'input-chat',
                reactive: true,
                can_focus: false,
                hover: true,
            });
            const responseChat = new PopupMenu.PopupMenuItem('', {
                style_class: 'response-chat',
                reactive: true,
                can_focus: false,
                hover: true,
            });

            // Create copy button
            const copyButton = new PopupMenu.PopupMenuItem('', {
                style_class: 'copy-icon',
                reactive: true,
                can_focus: false,
                hover: false,
            });

            // Separator
            const newSeparator = new PopupMenu.PopupSeparatorMenuItem();

            // Enable text selection
            inputChat.label.clutter_text.reactive = true;
            inputChat.label.clutter_text.selectable = true;

            // Disable clutter_text hover
            inputChat.label.clutter_text.hover = false;

            // Add ai temporary response to chat
            let aiResponse = _('<b>Gemini: </b> ...');
            responseChat.label.clutter_text.set_markup(aiResponse);

            // Enable text selection
            responseChat.label.clutter_text.reactive = true;
            responseChat.label.clutter_text.selectable = true;

            // Disable clutter_text hover
            responseChat.label.clutter_text.hover = false;

            // Chat settings
            inputChat.label.x_expand = true;
            responseChat.label.x_expand = true;
            this.chatSection.style_class += 'm-w-100';
            this.scrollView.style_class += 'm-w-100';

            // Add user question and ai response to chat
            this.chatSection.addMenuItem(newSeparator);
            this.chatSection.addMenuItem(inputChat);
            this.chatSection.addMenuItem(responseChat);

            // Set mouse click to copy response to clipboard
            copyButton.connect('activate', (_self) => {
                this._copySelectedText(responseChat, copyButton);
            });

            // Add user question to chat
            userQuestion = utils.inputformat(userQuestion);
            log('Question: ' + userQuestion);
            inputChat.label.clutter_text.set_markup(
                `<b>${_('Me')}: </b>${userQuestion}`,
            );

            // Get ai response for user question
            aiResponse = this.gemini.response(responseChat, userQuestion);

            // DEBUG
            // let aiResponse =
            //     'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius la';

            // Scroll down
            utils.scrollToBottom(responseChat, this.scrollView);

            // Add copy button to chat
            if (copyButton) {
                this.chatSection.addMenuItem(copyButton);
            }

            // Scroll down
            utils.scrollToBottom(responseChat, this.scrollView);

            // Enable searchEntry
            this.searchEntry.clutter_text.reactive = true;

            // Extract code and tts from response
            let answer = utils.extractCodeAndTTS(
                aiResponse,
                this.AZURE_SPEECH_LANGUAGE,
            );

            // Speech response
            if (answer.tts !== null) {
                let responseAudio = this.azure.tts(answer.tts);
                if (responseAudio.success) {
                    this.audio.play(responseAudio.path);
                }
            }

            // If answer.code is not null, copy to clipboard
            if (answer.code !== null) {
                this.extension.clipboard.set_text(
                    St.ClipboardType.CLIPBOARD,
                    answer.code,
                );
            }

            // Add to chat
            this.chatHistory.push({
                role: 'user',
                parts: [{text: userQuestion}],
            });
            this.chatHistory.push({
                role: 'model',
                parts: [{text: aiResponse}],
            });

            // Save history.json
            if (this.RECURSIVETALK) {
                utils.saveHistory(this.chatHistory);
            }
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
    },
);

export default class AivaExtension extends Extension {
    enable() {
        let url = 'https://thisipcan.cyou/json';
        let _httpSession = new Soup.Session();
        let message = Soup.Message.new('GET', url);
        this.app = new Aiva({
            clipboard: St.Clipboard.get_default(),
            settings: this.getSettings(),
            openSettings: this.openPreferences,
            uuid: this.uuid,
        });
        Main.panel.addToStatusArea('aiva-app', this.app, 1);
        _httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (_httpSession, result) => {
                let bytes = _httpSession.send_and_read_finish(result);
                let decoder = new TextDecoder('utf-8');
                let response = decoder.decode(bytes.get_data());
                const res = JSON.parse(response);
                let LOCATION = `${res.countryName}/${res.cityName}`;
                log(LOCATION);
                this.app.gemini.tune(
                    utils.getTuneString(this.USERNAME, LOCATION),
                );
            },
        );
    }

    disable() {
        this.app.destroy();
        this.app = null;
    }
}
