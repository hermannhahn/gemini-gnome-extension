// Text Format

export class Formatter {
    constructor() {
        this.lineLength = 100;
        this.MAX_POINTS = this.lineLength; // Comprimento máximo da linha em pontos
        this.spaceChar = '\x20'; // Espaço definido por \x20
        this.newlineChar = '\n'; // Quebra de linha definida por \n
    }

    // Return text with removeInvalidMarkups, breakLines and justifyText
    chat(text) {
        // let formatedText = this.removeInvalidMarkups(text);
        // formatedText = this.breakLines(formatedText);
        let formatedText = this.insertLineBreaks(text);
        return formatedText;
    }

    // Format input chat
    inputChat(text) {
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/`/g, '&#96;')
            .replace(/:/g, '&#58;')
            .replace(/;/g, '&#59;');
        return text;
    }

    // Format output chat
    outputChat(text) {
        text = this.chat(text);
        return text;
    }

    // Replace or remove bad markups
    removeInvalidMarkups(text) {
        let formatedText = text
            .replace(/&/g, '&amp;')
            .replace(/<code>/g, '') // Remove tags de abertura <code>
            .replace(/<\/code>/g, '') // Remove tags de fechamento <code>
            .replace(/<br>/g, '\n') // Substitui <br> por quebra de linha
            .replace(/<font[^>]*>/g, '') // Remove tags <font>
            .replace(/<\/font>/g, '') // Remove tags </font>
            .replace(/<a[^>]*>/g, '') // Remove tags <a>
            .replace(/<\/a>/g, '') // Remove tags </a>
            .replace(/<img[^>]*>/g, '') // Remove tags <img>
            .replace(/<\/img>/g, '') // Remove tags </img>
            .replace(/<span[^>]*>/g, '') // Remove tags <span>
            .replace(/<\/span>/g, ''); // Remove tags </span>

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

    // Função para calcular os pontos de uma palavra ou caractere
    calculatePoints(char) {
        if (
            char === 'l' ||
            char === 'i' ||
            char === 'I' ||
            char === 'j' ||
            char === '!' ||
            char === ':' ||
            char === ';'
        ) {
            return 0.5; // Caractere "l", "i" ou "I" vale 0,5 ponto
        }
        return 1; // Outros caracteres valem 1 ponto
    }

    // Função que justifica uma linha inserindo espaços uniformemente
    justifyLine(words, totalPoints) {
        if (words.length === 1) return words[0]; // Não justifica se for uma única palavra

        const spacesNeeded = this.MAX_POINTS - totalPoints; // Espaços necessários para preencher a linha
        const numGaps = words.length - 1; // Quantidade de lacunas entre as palavras

        const spaceWidth = Math.floor(spacesNeeded / numGaps); // Espaços uniformes
        let extraSpaces = spacesNeeded % numGaps; // Espaços extras a distribuir

        let justifiedLine = '';

        for (let i = 0; i < words.length - 1; i++) {
            justifiedLine += words[i];
            justifiedLine += this.spaceChar.repeat(
                spaceWidth + (extraSpaces > 0 ? 1 : 0),
            ); // Adiciona espaços extras nas primeiras lacunas
            if (extraSpaces > 0) extraSpaces--; // Reduz os espaços extras
        }

        justifiedLine += words[words.length - 1]; // Adiciona a última palavra

        return justifiedLine;
    }

    // Função que insere as quebras de linha
    format(text) {
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
