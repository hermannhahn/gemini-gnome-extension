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
import {AppLayout} from './ui.js';

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

            // UI
            this.ui = new AppLayout();

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

            // UI
            let tray = this.ui.tray;
            let icon = this.ui.icon;
            let item = this.ui.item;
            let micButton = this.ui.micButton;
            let clearButton = this.ui.clearButton;
            let settingsButton = this.ui.settingsButton;

            // App Tray
            tray.add_child(icon);
            this.add_child(tray);

            // Search Entry
            // when in focus and enter is pressed
            this.searchEntry.clutter_text.connect('activate', (actor) => {
                this.chat(actor.text);
                this.ui.searchEntry.clutter_text.set_text('');
                this.ui.searchEntry.clutter_text.reactive = false;
            });
            item.add_child(this.ui.searchEntry);

            // Mic Button
            // when clicked start or stop record
            micButton.connect('clicked', (_self) => {
                this.audio.record();
            });
            item.add_child(micButton);

            // Clear History Button
            // when clicked clear history
            clearButton.connect('clicked', (_self) => {
                this.ui.searchEntry.clutter_text.set_text('');
                this.chatHistory = [];
                this.menu.box.remove_child(this.ui.scrollView);
                this.ui.scrollView.add_child(this.ui.chatSection.actor);
                this.menu.box.add_child(this.ui.scrollView);
            });
            item.add_child(clearButton);

            // Settings Button
            // when clicked open settings
            settingsButton.connect('clicked', (_self) => {
                this._openSettings();
                this.menu.close();
            });
            item.add_child(settingsButton);

            // Scrollbar
            // add scroll bar to chat if needed
            this.ui.scrollView.add_child(this.ui.chatSection.actor); // Add scroll to chat section

            log(this.menu); // Remove
            log(this.menu.box); // Remove
            // Add items to app
            this.menu.addMenuItem(item);

            // Add chat section to app
            this.menu.box.add_child(this.ui.scrollView);

            // Open settings if gemini api key is not configured
            if (this.GEMINIAPIKEY === '') {
                this._openSettings();
            }
        }

        chat(userQuestion) {
            // Add user question to chat
            userQuestion = utils.inputformat(userQuestion);
            log('Question: ' + userQuestion);
            this.ui.inputChat.label.clutter_text.set_markup(
                `<b>${_('Me')}: </b>${userQuestion}`,
            );

            // Question
            this.ui.inputChat.label.clutter_text.reactive = true;
            this.ui.inputChat.label.clutter_text.selectable = true;
            this.ui.inputChat.label.clutter_text.hover = false;
            this.ui.inputChat.label.x_expand = true;

            // Add user question and ai response to chat
            this.ui.chatSection.addMenuItem(this.ui.newSeparator);
            this.ui.chatSection.addMenuItem(this.ui.inputChat);
            this.ui.chatSection.addMenuItem(this.ui.responseChat);

            // Send question to AI
            this.gemini.chat(userQuestion);

            // Copy button
            this.ui.copyButton.connect('activate', (_self) => {
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
