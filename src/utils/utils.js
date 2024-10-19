export default class Utils {
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
}
