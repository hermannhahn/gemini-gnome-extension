import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export class AppLayout {
    constructor() {
        console.log('ui loaded');
    }

    static tray = () => {
        return new St.BoxLayout({
            style_class: 'panel-status-menu-box',
        });
    };

    static icon = () => {
        return new St.Icon({
            style_class: 'google-gemini-icon',
        });
    };

    // Create app items
    static item = () => {
        return new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
    };

    // Search entry
    static searchEntry = () => {
        return new St.Entry({
            name: 'aiEntry',
            style_class: 'ai-entry',
            can_focus: true,
            hint_text: _('Ask me anything...'),
            track_hover: true,
            x_expand: true,
            y_expand: true,
        });
    };

    static micButton = () => {
        return new St.Button({
            can_focus: true,
            toggle_mode: true,
            style_class: 'mic-icon',
        });
    };

    static clearButton = () => {
        return new St.Button({
            can_focus: true,
            toggle_mode: true,
            style_class: 'trash-icon',
        });
    };

    static settingsButton = () => {
        return new St.Button({
            can_focus: true,
            toggle_mode: true,
            style_class: 'settings-icon',
        });
    };

    static chatSection = () => {
        return new PopupMenu.PopupMenuSection({
            style_class: 'chat-section',
            x_expand: true,
            y_expand: true,
        });
    };

    static scrollView = () => {
        return new St.ScrollView({
            style_class: 'chat-scroll-section',
            reactive: true,
            overlay_scrollbars: false,
        });
    };

    static inputChat = () => {
        return new PopupMenu.PopupMenuItem('', {
            style_class: 'input-chat',
            reactive: true,
            can_focus: false,
            hover: true,
        });
    };

    static responseChat = () => {
        return new PopupMenu.PopupMenuItem('', {
            style_class: 'response-chat',
            reactive: true,
            can_focus: false,
            hover: true,
        });
    };

    static copyButton = () => {
        return new PopupMenu.PopupMenuItem('', {
            style_class: 'copy-icon',
            reactive: true,
            can_focus: false,
            hover: false,
        });
    };

    static newSeparator = () => {
        return new PopupMenu.PopupSeparatorMenuItem();
    };
}
