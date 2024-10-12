// Text Format

/**
 * @param {string} text
 */
export function format(text) {
    // Replace all * char with space
    text = text.split('*').join(' ');
    // Break line if greater then 900px
    text = text.replace(/(.{900})/g, '$1\n');
    // Replace all ` with <code>
    text = text.replace(/`/g, '<code>');
    // Replace all </code> with `
    text = text.replace(/<\/code>/g, '`');

    return text;
}
