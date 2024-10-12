# Gemini Voice Assistant for Ubuntu

Gemini AI Voice and Chat, this project is under construction and is not ready.

## Install

git clone https://github.com/hermann-s/gemini-gnome-extension.git<br>
cd gemini-gnome-extension<br>
npm run install<br>

## Dev

npm run save<br>
npm run new:[upgrade|update|patch]<br>
npm run publish<br>

## Project Structure

```
project-directory/
├── data/
├── po/ [missing]
├── scripts/
│   ├── build.sh
│   ├── install.sh
│   ├── new.sh
│   ├── publish.sh
│   └── save.sh
├── src/
│   ├── assets/*
│   ├── schemas/
│   │   └── org.gnome.shell.extensions.gva.gschema.xml
│   ├── extension.js
│   ├── md2pango.js
│   ├── prefs.js
|   └── stylesheet.css
├── .editorconfig
├── .gitignore
├── eslint.config.js
├── metadata.json
├── metadata.json
├── package.json
├── prettier.config.js
└── README.md
```

-   `data/` contains files that will be bundled into a [GResource](https://docs.gtk.org/gio/struct.Resource.html) file when building your extension.
-   `po/` contains files for the [translation of your project](https://gjs.guide/extensions/development/translations.html). The template file (`*.pot`) lists all translatable strings. Translators will use this template to create translation files (`*.po`).
-   `scripts/` consists of scripts to build and install your extension. The scripts have `--help` flags. They can also be called via the npm scripts in `package.json`.
-   `src/` is where the actual source code of your extension will reside. `extension.js` is the main entry point, `prefs.js` is the entry point for your preference window, `md2pango.js` is a helper script to render Markdown in Pango, and `stylesheet.css` is a CSS file for styling your extension.
-   `.editorconfig` provides configuration for editors.
-   `eslint.config.js` provides configuration for the ESLint code linter.
-   `metadata.json` provides information about your extension for GNOME Shell's extension system.
-   `package.json` contains information about your project, including dependencies and scripts.
-   `prettier.config.js` provides configuration for the Prettier code formatter.
-   `README.md` is a file that describes this project.

Other files may be included but they aren't directly related to extension development.

## TODO

-   [x] Implement GNOME Shell Integration
-   [x] Implement Settings UI
-   [x] Implement Gemini API
-   [x] Implement Recorder
-   [x] Implement Azure Speech to Text API
-   [x] Implement Azure Text To Speech API
-   [x] Implement generic voice response for long responses
-   [x] Implement auto copy to clipboard code examples
-   [x] Implement don't speech code examples
-   [x] Implement Chat UI
-   [x] Implement development scripts
-   [x] Implement Release Process
-   [x] Implement README
-   [x] Implement Clear History Button
-   [ ] Implement Voice activation with hotkeys
-   [ ] Implement Stop Button to stop speech.
-   [ ] Implement Documentation
-   [ ] Implement Testing
-   [ ] Implement Translations
-   [ ] Implement User Experience
-   [ ] Implement User Feedback

## Bug Fixes

-   [ ] Chat Scrolling
-   [ ] Formatting chat messages

## License

This software is distributed under the terms of the GNU General Public License, version 2 or later. See the license file for details.
