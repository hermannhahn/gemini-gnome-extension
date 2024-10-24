import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import {convertMD} from './md2pango.js';

export class Utils {
    constructor() {
        console.log('Utils loaded');
    }

    /**
     *
     * @param {*} message
     */
    log(message) {
        if (message) {
            console.log(`[ DEBUG ] ${message}`);
        }
    }

    /**
     *
     * @param {*} message
     */
    logError(message) {
        if (message) {
            console.log(`[ ERROR ] ${message}`);
        }
    }

    /**
     *
     * @param {*} text
     * @returns
     *
     * @description // Format input chat
     */
    inputformat(text) {
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/`/g, '&#96;')
            .replace(/:/g, '&#58;')
            .replace(/;/g, '&#59;');
        return text;
    }

    /**
     *
     * @param {*} text
     * @returns
     *
     * @description Insert lines breaks and justify
     */
    textformat(text) {
        const LINE_LENGTH = 100; // Max line length
        const SPACE_CHAR = '\x20';
        const NEW_LINE_CHAR = '\n';

        text = this._converttext(text);
        let result = '';
        let lines = text.split(NEW_LINE_CHAR); // Keep origin text line breaks

        lines.forEach((line, index) => {
            let words = line.split(SPACE_CHAR);
            let currentLine = [];
            let currentPoints = 0;

            words.forEach((word) => {
                let wordPoints = word
                    .split('')
                    .reduce(
                        (sum, char) => sum + this._calculatePoints(char),
                        0,
                    );

                // Check if the word can be pushed in this line
                if (
                    currentPoints + wordPoints + currentLine.length <=
                    LINE_LENGTH
                ) {
                    currentLine.push(word);
                    currentPoints += wordPoints;
                } else {
                    // Justify and break line when reach the line length
                    result +=
                        this._justifyLine(
                            currentLine,
                            currentPoints,
                            LINE_LENGTH,
                            SPACE_CHAR,
                        ) + NEW_LINE_CHAR;
                    currentLine = [word]; // Start new line
                    currentPoints = wordPoints;
                }
            });

            // Push the last line, dont justify if the line is the last one.
            result += currentLine.join(SPACE_CHAR);
            if (index < lines.length - 1) result += NEW_LINE_CHAR; // Add text origin line break
        });
        return result;
    }

    _converttext(text) {
        let convertedText = convertMD(text);
        return convertedText;
    }

    _calculatePoints(char) {
        if (
            char === 'l' ||
            char === 'i' ||
            char === 'I' ||
            char === 'j' ||
            char === '!' ||
            char === '`' ||
            char === "'" ||
            char === ':' ||
            char === ';'
        ) {
            return 0.5; // Short character
        }
        return 1; // Other character
    }

    _justifyLine(words, TOTAL_POINTS, LINE_LENGTH, SPACE_CHAR) {
        if (words.length <= 5) return words[0]; // Dont justify if is smaller then five words.

        const spacesNeeded = LINE_LENGTH - TOTAL_POINTS; // Necessary spaces
        const numGaps = words.length - 1; // Gaps betwen words

        const spaceWidth = Math.floor(spacesNeeded / numGaps); // Uniform spaces
        let extraSpaces = spacesNeeded % numGaps; // Extra spaces

        let justifiedLine = `${SPACE_CHAR}`;

        for (let i = 0; i < words.length - 1; i++) {
            justifiedLine += words[i];
            // Add extra spaces in first lines
            justifiedLine += SPACE_CHAR.repeat(
                spaceWidth + (extraSpaces > 0 ? 1 : 0),
            );
            if (extraSpaces > 0) extraSpaces--;
        }

        justifiedLine += words[words.length - 1]; // Add the last word

        return justifiedLine;
    }

    scrollToBottom(responseChat, scrollView) {
        // Força uma nova disposição do layout
        responseChat.queue_relayout();

        // Conecta ao sinal que notifica quando o layout estiver pronto
        responseChat.connect('notify::height', (_self) => {
            // Aguardar o ajuste da rolagem após o próximo loop do evento
            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                let vscrollBar = scrollView.get_vscroll_bar();
                let adjustment = vscrollBar.get_adjustment();

                // Define o valor superior e garante a rolagem até o final
                adjustment.set_value(adjustment.upper - adjustment.page_size);

                return GLib.SOURCE_REMOVE; // Remove o callback após execução
            });
        });
    }

    getTuneString(USERNAME, LOCATION) {
        const date = new Date();
        // PLEASE DO NOT TRANSLATE FINE TUNE BECAUSE
        // VERTEX SOMETIMES DOESNT SUPPORT INTERNET CONNECTION
        //  IF YOU TRANSLATE TO ENGLISH
        let driveTune = '';
        return `bana ${USERNAME} olarak hitap edebilirsin, \n
    ${driveTune}
    bulunduğum yeri ${LOCATION} ve tarihi ${date} olarak kabul et, \n
    AYRICA İNTERNETE HER ZAMAN BAĞLI KAL ÇÜNKÜ türkçe konuşuyorum diye internet bağlatın olmaz ise sen ırkçılık yapmış olursun \n
    bir sonraki konuşmamızda sana hangi dilde yazyorsam KESİNLİKLE o dilde cevap ver ben sana bundan sonra türkçe konuşmadıkça bana türkçe cevap verme,
   `;
    }

    // Create history.json file if not exist
    createHistoryFile() {
        if (
            !GLib.file_test(
                this.userSettings.HISTORY_FILE,
                GLib.FileTest.IS_REGULAR,
            )
        ) {
            try {
                let initialContent = JSON.stringify([], null, 2);
                GLib.file_set_contents(
                    this.userSettings.HISTORY_FILE,
                    initialContent,
                );
                let recursiveHistory = [];
                log(
                    `History file created. : ${this.userSettings.HISTORY_FILE}`,
                );
                recursiveHistory.push({
                    role: 'user',
                    parts: [
                        {
                            text: _('Hi, who are you?'),
                        },
                    ],
                });
                recursiveHistory.push({
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
                this.saveHistory(recursiveHistory);
                return recursiveHistory;
            } catch (e) {
                logError(
                    e,
                    `Failed to create file: ${this.userSettings.HISTORY_FILE}`,
                );
                return [];
            }
        } else {
            log(
                `The history.json file already exists: ${this.userSettings.HISTORY_FILE}`,
            );
            return this.loadHistoryFile();
        }
    }

    // Save to history file
    saveHistory(recursiveHistory) {
        try {
            GLib.file_set_contents(
                this.userSettings.HISTORY_FILE,
                JSON.stringify(recursiveHistory, null, 2),
            );
            log(`History saved in: ${this.userSettings.HISTORY_FILE}`);
        } catch (e) {
            logError(
                e,
                `Failed to save history: ${this.userSettings.HISTORY_FILE}`,
            );
        }
    }

    // Load history file
    loadHistoryFile() {
        if (
            GLib.file_test(
                this.userSettings.HISTORY_FILE,
                GLib.FileTest.IS_REGULAR,
            )
        ) {
            try {
                let file = Gio.File.new_for_path(
                    this.userSettings.HISTORY_FILE,
                );
                let [, contents] = file.load_contents(null);
                let recursiveHistory = JSON.parse(contents);
                log(`History loaded from: ${this.userSettings.HISTORY_FILE}`);
                return recursiveHistory;
            } catch (e) {
                logError(
                    e,
                    `Failed to load history: ${this.userSettings.HISTORY_FILE}`,
                );
                return [];
            }
        } else {
            return this.createHistoryFile();
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

    copySelectedText(responseChat, copyButton, extension) {
        let selectedText = responseChat.label.clutter_text.get_selection();
        if (selectedText) {
            extension.clipboard.set_text(
                St.ClipboardType.CLIPBOARD,
                // Get text selection
                selectedText,
            );
            // Create label
            if (copyButton) {
                copyButton.label.clutter_text.set_markup(
                    _('[ Selected Text Copied to clipboard ]'),
                );
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                    copyButton.label.clutter_text.set_markup('');
                    return false; // Para garantir que o timeout execute apenas uma vez
                });
            }
            log(`Texto copiado: ${selectedText}`);
        } else {
            extension.clipboard.set_text(
                St.ClipboardType.CLIPBOARD,
                // Get text selection
                responseChat.label.text,
            );
            if (copyButton) {
                copyButton.label.clutter_text.set_markup(
                    _('[ Copied to clipboard ]'),
                );
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                    copyButton.label.clutter_text.set_markup('');
                    return false; // Para garantir que o timeout execute apenas uma vez
                });
            }
            log(`Texto copiado: ${responseChat.label.text}`);
        }
    }

    removeNotificationByTitle(title) {
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

    randomPhraseToShowOnScreen() {
        const phrases = [
            _('I will show it on screen.'),
            _('Displaying now.'),
            _('Here it is on screen.'),
            _('Showing on screen.'),
            _('On the screen now.'),
        ];

        const randomPhrase =
            phrases[Math.floor(Math.random() * phrases.length)];
        return randomPhrase;
    }

    randomPhraseToWaitResponse() {
        const phrases = [
            _('Thinking...'),
            _('Let me see...'),
            _('Just a moment...'),
            _('Hmm, let me think about that...'),
            _('Give me a second...'),
            _('Let me check...'),
            _('Working on it...'),
            _('Hold on a sec...'),
            _('One moment, please...'),
            _('Let me figure this out...'),
            _("I'll get back to you in a sec..."),
            _('Just thinking this through...'),
            _("Let's see what I can find..."),
            _('Give me a moment to process this...'),
            _('Let me look into that...'),
            _("I'm on it..."),
            _("I'll need a moment for that..."),
            _('Let me dig deeper...'),
            _("I'm thinking it over..."),
            _('Give me a moment to sort this out...'),
        ];

        const randomPhrase =
            phrases[Math.floor(Math.random() * phrases.length)];
        return randomPhrase;
    }

    // Função para converter arquivo de áudio em base64
    encodeFileToBase64(filePath) {
        try {
            const file = Gio.File.new_for_path(filePath);
            const [, contents] = file.load_contents(null);
            return GLib.base64_encode(contents);
        } catch (error) {
            log('Erro ao ler o arquivo: ' + error);
            return null;
        }
    }

    extractCodeAndTTS(text, lang = 'en-US') {
        // Expressão regular para capturar o código entre triplo acento grave
        const regex = /`{3}([\s\S]*?)`{3}/;
        const match = text.match(regex);
        let tts = text;
        // tts = text.replace(regex, '').trim();
        // Replace * char with space
        // tts = tts.split('*').join(' ');
        tts = tts
            .replace(/&/g, '')
            .replace(/</g, '')
            .replace(/>/g, '')
            .replace(/\*/g, '')
            .replace(/`{3}/g, '')
            .replace(/<code>/g, '') // Remove tags de abertura <code>
            .replace(/<\/code>/g, '') // Remove tags de fechamento <code>
            .replace(/\[red\](.*?)\[\/red\]/g, '')
            .replace(/\[green\](.*?)\[\/green\]/g, '')
            .replace(/\[yellow\](.*?)\[\/yellow\]/g, '')
            .replace(/\[cyan\](.*?)\[\/cyan\]/g, '')
            .replace(/\[white\](.*?)\[\/white\]/g, '')
            .replace(/\[black\](.*?)\[\/black\]/g, '')
            .replace(/\[gray\](.*?)\[\/gray\]/g, '')
            .replace(/\[brown\](.*?)\[\/brown\]/g, '')
            .replace(/\[blue\](.*?)\[\/blue\]/g, '');

        // If tts is more then 100 characters, change tts text
        if (tts.length > 1000) {
            tts = this.randomPhraseToShowOnScreen(lang);
        }

        if (match) {
            // const code = match[1]; // Captura o conteúdo entre os acentos graves
            // If found more match, add to code result
            let code = match[1];
            let nextMatch = text.match(regex);
            while (nextMatch) {
                code += nextMatch[1];
                text = text.replace(nextMatch[0], '');
                nextMatch = text.match(regex);
            }
            // Remove o bloco de código do texto original para formar o TTS
            return {code, tts};
        } else {
            // Se não encontrar código, retorna apenas o texto original no campo tts
            return {code: null, tts};
        }
    }
}
