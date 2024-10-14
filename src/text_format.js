// Text Format

/**
 * @param {string} text - Text to be formatted
 * @param {boolean} breakLines - Break lines if text is too long
 * @returns {string} Formatted text
 */
export function format(text, breakLines = false) {
    let formatedText = text
        .replace(/<\/?p>/g, '\n') // <p> -> quebra de linha
        .replace(/<li>/g, '• ') // <li> -> bullet point
        .replace(/<\/li>/g, '\n') // Fecha <li> -> nova linha
        .replace(/<br\s*\/?>/g, '\n') // <br> -> nova linha
        .replace(/<\/?a[^>]*>/g, '') // Remove as tags <a>
        .replace(/<\/a>/g, '') // Remove tags de fechamento <a>
        .replace(/<a href="([^"]+)">/g, '<u>$1</u>'); // Converte links para texto sublinhado;

    // Line breaker
    if (breakLines) {
        let lines = formatedText.split('\n');
        let result = '';
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.length > 90) {
                let words = line.split(' ');
                let currentLine = '';
                for (let j = 0; j < words.length; j++) {
                    let word = words[j];
                    if (currentLine.length + word.length > 90) {
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
    return formatedText;
}
