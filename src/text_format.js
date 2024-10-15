// Text Format

export class Formatter {
    constructor() {
        this.lineLength = 110;
    }

    // Return text with removeInvalidMarkups, breakLines and justifyText
    chat(text) {
        let formatedText = this.removeInvalidMarkups(text);
        // formatedText = this.breakLines(formatedText);
        formatedText = this.justifyText(formatedText);
        return formatedText;
    }

    // Add escapes for user question
    pango(text) {
        let formatedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        formatedText = this.breakLines(formatedText);
        return formatedText;
    }

    // Replace or remove bad markups
    removeInvalidMarkups(text) {
        let formatedText = text
            .replace(/&/g, '&amp;')
            .replace(/<code>/g, '') // Remove tags de abertura <code>
            .replace(/<\/code>/g, '') // Remove tags de fechamento <code>
            .replace(/\[red\](.*?)\[\/red\]/g, '\x1b[31m$1\x1b[0m')
            .replace(/\[green\](.*?)\[\/green\]/g, '\x1b[32m$1\x1b[0m')
            .replace(/\[yellow\](.*?)\[\/yellow\]/g, '\x1b[33m$1\x1b[0m')
            .replace(/\[cyan\](.*?)\[\/cyan\]/g, '\x1b[36m$1\x1b[0m')
            .replace(/\[white\](.*?)\[\/white\]/g, '\x1b[37m$1\x1b[0m')
            .replace(/\[black\](.*?)\[\/black\]/g, '\x1b[30m$1\x1b[0m')
            .replace(/\[gray\](.*?)\[\/gray\]/g, '\x1b[90m$1\x1b[0m')
            .replace(/\[brown\](.*?)\[\/brown\]/g, '\x1b[33m$1\x1b[0m')
            .replace(/\[blue\](.*?)\[\/blue\]/g, '\x1b[34m$1\x1b[0m');

        return formatedText;
    }

    // Line breaker
    breakLines(text) {
        let lines = text.split('\n');
        let result = '';
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.length > this.lineLength) {
                let words = line.split(' ');
                let currentLine = '';
                for (let j = 0; j < words.length; j++) {
                    let word = words[j];
                    if (currentLine.length + word.length > this.lineLength) {
                        result += currentLine + '\n';
                        currentLine = word + ' ';
                    } else {
                        currentLine += word + ' ';
                    }
                }
                result += currentLine + '\n';
            } else {
                result += line + '\n';
            }
        }
        return result;
    }

    justifyText(text) {
        const lines = text.split('\n');
        let result = '';

        lines.forEach((line) => {
            if (line.length > this.lineLength) {
                let words = line.split(' ');
                let currentWords = [];
                let currentLength = 0;

                words.forEach((word) => {
                    if (
                        currentLength + word.length + currentWords.length <=
                        this.lineLength
                    ) {
                        currentWords.push(word);
                        currentLength += word.length;
                    } else {
                        result += this.justifyLine(currentWords) + '\n';
                        currentWords = [word];
                        currentLength = word.length;
                    }
                });

                // Adiciona a última linha (não justificada)
                result += currentWords.join(' ') + '\n';
            } else {
                result += line + '\n';
            }
        });

        return result;
    }

    justifyLine(words) {
        if (words.length === 1) return words[0]; // Não justifica se for só uma palavra

        const totalWordsLength = words.reduce(
            (sum, word) => sum + word.length,
            0,
        );
        const totalSpaces = this.lineLength - totalWordsLength;
        const spacesBetweenWords = Math.floor(totalSpaces / (words.length - 1));
        const extraSpaces = totalSpaces % (words.length - 1);

        let justifiedLine = '';

        for (let i = 0; i < words.length - 1; i++) {
            justifiedLine += words[i];
            justifiedLine += '\x20 '.repeat(
                spacesBetweenWords + (i < extraSpaces ? 1 : 0),
            ); // Distribui os espaços extras nas primeiras palavras
        }

        justifiedLine += words[words.length - 1]; // Adiciona a última palavra sem espaço extra

        return justifiedLine;
    }
}
