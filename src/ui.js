import St from 'gi://St';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// Utils
const utils = new Utils();

export class ui {
    constructor() {
        console.log('ui loaded');
    }

    tray = new St.BoxLayout({
        style_class: 'panel-status-menu-box',
    });

    icon = new St.Icon({
        style_class: 'google-gemini-icon',
    });

    // Create app items
    item = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
    });

    // Search entry
    searchEntry = new St.Entry({
        name: 'aiEntry',
        style_class: 'ai-entry',
        can_focus: true,
        hint_text: _('Ask me anything...'),
        track_hover: true,
        x_expand: true,
        y_expand: true,
    });
}
