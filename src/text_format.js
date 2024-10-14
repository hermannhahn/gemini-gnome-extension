// Text Format

/**
 * @param {string} text
 */
export function format(text) {
    let formatedText = text
        .replace(/\*/g, ' ') // Remove all * char from text
        .replace(/`{3}\s*\w+\s*/g, '`{3}') // Remove first word after triple ` char
        .replace(/`{3}/g, ''); // Replace triple ` char

    // Line breaker
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
