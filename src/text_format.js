// Text Format

/**
 * @param {string} text
 */
export function format(text) {
    // Replace all * char with space
    text = text.split('*').join(' ');
    // Break line if greater then 900px
    text = text.replace(/(.{900})/g, '$1\n');
    return text;
}
