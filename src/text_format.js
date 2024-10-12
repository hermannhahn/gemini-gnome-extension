// Text Format

/**
 * @param {string} text
 */
export function format(text) {
    // Replace all * char with space
    text = text.split('*').join(' ');
    // Replace all ` char with space
    text = text.split('`').join(' ');
    // Replace all \n char with <br>
    text = text.split('\n').join('<br>');
    // Replace all & char with &amp;
    text = text.split('&').join('&amp;');
    // Replace all < char with &lt;
    text = text.split('<').join('&lt;');
    // Replace all > char with &gt;
    text = text.split('>').join('&gt;');
    return text;
}
