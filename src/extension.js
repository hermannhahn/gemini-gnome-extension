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
import {ui} from './ui.js';

// Utils
const utils = new Utils();

const Aiva = GObject.registerClass(
    class Aiva extends PanelMenu.Button {
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

            // Get settings
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
            this.LOCATION = '';

            // Get history
            this.chatHistory = utils.loadHistoryFile() || [];

            // Global variables
            this.searchEntry = ui.searchEntry;
            this.micButton = ui.micButton;
            this.clearButton = ui.clearButton;
            this.settingsButton = ui.settingsButton;
            this.chatSection = ui.chatSection;
            this.scrollView = ui.scrollView;
            this.inputChat = ui.inputChat;
            this.responseChat = ui.responseChat;
            this.copyButton = ui.copyButton;

            // Create instances
            this.gemini = new GoogleGemini(this);
            this.audio = new Audio(this);
        }

        /**
         * @param {*} extension
         *
         * @description Initialize extension
         */
        _init(extension) {
            this.keyLoopBind = 0;
            this.extension = extension;
            super._init(0.0, _('AIVA'));
            this._loadSettings();

            // App Tray
            ui.tray.add_child(ui.icon);
            this.add_child(ui.tray);

            // Search Entry
            // when in focus and enter is pressed
            this.searchEntry.clutter_text.connect('activate', (actor) => {
                this.chat(actor.text);
                this.searchEntry.clutter_text.set_text('');
                this.searchEntry.clutter_text.reactive = false;
            });
            ui.item.add_child(this.searchEntry);

            // Mic Button
            // when clicked start or stop record
            ui.micButton.connect('clicked', (_self) => {
                this.audio.record();
            });
            ui.item.add_child(ui.micButton);

            // Clear History Button
            // when clicked clear history
            ui.clearButton.connect('clicked', (_self) => {
                this.searchEntry.clutter_text.set_text('');
                this.chatHistory = [];
                this.menu.box.remove_child(this.scrollView);
                this.chatSection = new PopupMenu.PopupMenuSection();
                this.scrollView.add_child(this.chatSection.actor);
                this.menu.box.add_child(this.scrollView);
            });
            ui.item.add_child(ui.clearButton);

            // Settings Button
            // when clicked open settings
            ui.settingsButton.connect('clicked', (_self) => {
                this._openSettings();
                this.menu.close();
            });
            ui.item.add_child(ui.settingsButton);

            // Scrollbar
            // add scroll bar to chat if needed
            this.scrollView.add_child(this.chatSection.actor); // Add scroll to chat section

            log(this.menu); // Remove
            log(this.menu.box); // Remove
            // Add items to app
            this.menu.addMenuItem(ui.item);

            // Add chat section to app
            this.menu.box.add_child(this.scrollView);

            // Open settings if gemini api key is not configured
            if (this.GEMINIAPIKEY === '') {
                this._openSettings();
            }
        }

        chat(userQuestion) {
            // Add user question to chat
            userQuestion = utils.inputformat(userQuestion);
            log('Question: ' + userQuestion);
            this.inputChat.label.clutter_text.set_markup(
                `<b>${_('Me')}: </b>${userQuestion}`,
            );

            // Question
            this.inputChat.label.clutter_text.reactive = true;
            this.inputChat.label.clutter_text.selectable = true;
            this.inputChat.label.clutter_text.hover = false;
            this.inputChat.label.x_expand = true;

            // Add user question and ai response to chat
            this.chatSection.addMenuItem(ui.newSeparator);
            this.chatSection.addMenuItem(this.inputChat);
            this.chatSection.addMenuItem(this.responseChat);

            // Send question to AI
            this.gemini.chat(userQuestion);

            // Copy button
            this.copyButton.connect('activate', (_self) => {
                utils.copySelectedText(this);
            });
        }

        _openSettings() {
            this.extension.openSettings();
        }

        _destroyLoop() {
            if (this.afterTune) {
                clearTimeout(this.afterTune);
                this.afterTune = null;
            }
        }

        _destroy() {
            this._destroyLoop();
            super._destroy();
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
                // this.app.gemini.tune(
                //     utils.getTuneString(this.USERNAME, LOCATION),
                // );
            },
        );
    }

    disable() {
        this.app._destroy();
        this.app = null;
    }
}
