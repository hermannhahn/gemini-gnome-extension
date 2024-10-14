// Text Format

/**
 * @param {string} text
 */
export function format(text) {
    let html = text
        .replace(/\*/g, ' ') // Remove all * char from text
        .replace(/`{3}\s*\w+\s*/g, '`{3}') // Remove first word after triple ` char
        .replace(/`{3}/g, '') // Replace triple ` char
        .replace(/<\/?p>/g, '\n') // <p> -> quebra de linha
        .replace(/<li>/g, '• ') // <li> -> bullet point
        .replace(/<\/li>/g, '\n') // Fecha <li> -> nova linha
        .replace(/<ul>|<\/ul>/g, '') // Remove <ul> tags
        .replace(/<ol>/g, '') // Remove <ol> tag
        .replace(/<\/ol>/g, '') // Remove </ol> tag
        .replace(/<br\s*\/?>/g, '\n') // <br> -> nova linha
        .replace(/<del>/g, '\x1b[38;5;220m~~') // Replace with red color and similar ansi code
        .replace(/<\/del>|<\/ins>|<\/strike>/g, '\x1b[0m~~') // Remove color
        .replace(/<ins>/g, '\x1b[38;5;39m~~') // Replace with blue color and similar ansi code
        .replace(/<\/ins>/g, '\x1b[0m~~') // Remove color
        .replace(/<strike>/g, '\x1b[38;5;202m~~') // Replace with orange color and similar ansi code
        .replace(/<\/strike>/g, '\x1b[0m~~') // Remove color
        .replace(/<code>/g, '\x1b[38;5;6m') // Replace with green color and similar ansi code
        .replace(/<\/code>/g, '\x1b[0m'); // Remove color

    // Line breaker
    let lines = html.split('\n');
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
