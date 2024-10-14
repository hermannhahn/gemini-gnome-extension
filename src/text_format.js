// Text Format

/**
 * @param {string} text
 */
export function format(text) {
    // Remove all * char from text
    text = text.replace(/\*/g, ' ');
    // Remove first word after triple ` char
    text = text.replace(/`{3}\s*\w+\s*/g, '`{3}');
    // Replace triple ` char
    text = text.replace(/`{3}/g, '');
    // Line breaker
    let lines = text.split('\n');
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
