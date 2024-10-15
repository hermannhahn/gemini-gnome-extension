// Text Format

export class Formatter {
    pango(text) {
        let formatedText = text
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
            if (line.length > 150) {
                let words = line.split(' ');
                let currentLine = '';
                for (let j = 0; j < words.length; j++) {
                    let word = words[j];
                    if (currentLine.length + word.length > 150) {
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
}
