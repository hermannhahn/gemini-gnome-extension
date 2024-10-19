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
     * @param {*} text
     * @returns
     *
     * @description Insert break lines
     */
    insertLineBreaks(text) {
        let result = '';
        let lines = text.split(this.newlineChar); // Preserva as quebras de linha existentes

        lines.forEach((line, index) => {
            let words = line.split(this.spaceChar);
            let currentLine = [];
            let currentPoints = 0;

            words.forEach((word) => {
                let wordPoints = word
                    .split('')
                    .reduce((sum, char) => sum + this.calculatePoints(char), 0);

                // Verifica se a palavra cabe na linha atual
                if (
                    currentPoints + wordPoints + currentLine.length <=
                    this.MAX_POINTS
                ) {
                    currentLine.push(word);
                    currentPoints += wordPoints;
                } else {
                    // Justifica e quebra a linha quando atinge o limite
                    result +=
                        this.justifyLine(currentLine, currentPoints) +
                        this.newlineChar;
                    currentLine = [word]; // Inicia nova linha com a palavra atual
                    currentPoints = wordPoints;
                }
            });

            // Adiciona a última linha processada, não precisa justificar se for a última linha sem atingir o limite
            result += currentLine.join(this.spaceChar);
            if (index < lines.length - 1) result += this.newlineChar; // Adiciona a quebra de linha original
        });
        return result;
    }
}
