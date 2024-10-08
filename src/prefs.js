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
        const defaultGKey = this.schema.get_string('google-api-key');
        const defaultFolder = this.schema.get_string('drive-folder');
        const defaultLog = this.schema.get_boolean('log-history');
        const defaultVertex = this.schema.get_boolean('vertex-enabled');
        const defaultVertexProject =
            this.schema.get_string('vertex-project-id');

        const label = new Gtk.Label({
            label: _('Gemini API Key'),
            halign: Gtk.Align.START,
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToButton = new Gtk.LinkButton({
            label: _('How to get API key?'),
            uri: 'https://github.com/wwardaww/gnome-gemini-ai?tab=readme-ov-file#using-gemini-api-key',
        });

        const labelGoogle = new Gtk.Label({
            label: _('Gemini API Key'),
            halign: Gtk.Align.START,
        });
        const googleApiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const howToButtonGoogle = new Gtk.LinkButton({
            label: _('How to get API key?'),
            uri: 'https://github.com/wwardaww/gnome-gemini-ai?tab=readme-ov-file#using-gemini-api-key',
        });

        const labelFolder = new Gtk.Label({
            label: _('Drive Folder for Vertex \n (optional)'),
            halign: Gtk.Align.START,
        });
        const folderUrl = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });

        const histroyLabel = new Gtk.Label({
            label: _('Remember talk history'),
            halign: Gtk.Align.START,
        });
        const histroyButton = new Gtk.Switch();

        const vertexLabel = new Gtk.Label({
            label: _('Enable Vertex API'),
            halign: Gtk.Align.START,
        });
        const VertexButton = new Gtk.Switch();

        const vertexProjectLabel = new Gtk.Label({
            label: _('Vertex Project ID'),
            halign: Gtk.Align.START,
        });
        const VertexProject = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer(),
        });
        const save = new Gtk.Button({
            label: _('Save'),
        });
        const statusLabel = new Gtk.Label({
            label: '',
            useMarkup: true,
            halign: Gtk.Align.CENTER,
        });

        histroyButton.set_active(defaultLog);
        VertexButton.set_active(defaultVertex);
        apiKey.set_text(defaultKey);
        googleApiKey.set_text(defaultGKey);
        VertexProject.set_text(defaultVertexProject);
        folderUrl.set_text(defaultFolder);
        save.connect('clicked', () => {
            this.schema.set_string(
                'gemini-api-key',
                apiKey.get_buffer().get_text(),
            );
            this.schema.set_string(
                'google-api-key',
                googleApiKey.get_buffer().get_text(),
            );
            this.schema.set_string(
                'drive-folder',
                folderUrl.get_buffer().get_text(),
            );
            this.schema.set_string(
                'vertex-project-id',
                VertexProject.get_buffer().get_text(),
            );
            this.schema.set_boolean('log-history', histroyButton.state);
            this.schema.set_boolean('vertex-enabled', VertexButton.state);
            statusLabel.set_markup(_('Your preferences have been saved'));
        });

        // col, row, 1, 1
        this.main.attach(label, 0, 0, 1, 1);
        this.main.attach(apiKey, 2, 0, 2, 1);
        this.main.attach(howToButton, 4, 0, 1, 1);

        this.main.attach(labelGoogle, 0, 1, 1, 1);
        this.main.attach(googleApiKey, 2, 1, 2, 1);
        this.main.attach(howToButtonGoogle, 4, 1, 1, 1);

        this.main.attach(labelFolder, 0, 2, 1, 1);
        this.main.attach(folderUrl, 2, 2, 2, 1);

        this.main.attach(histroyLabel, 0, 3, 1, 1);
        this.main.attach(histroyButton, 2, 3, 1, 1);

        this.main.attach(vertexLabel, 0, 4, 1, 1);
        this.main.attach(VertexButton, 2, 4, 1, 1);

        this.main.attach(vertexProjectLabel, 0, 5, 1, 1);
        this.main.attach(VertexProject, 2, 5, 2, 1);

        this.main.attach(save, 2, 6, 1, 1);
        this.main.attach(statusLabel, 0, 7, 5, 1);

        this.ui.add(this.main);
    }
}
