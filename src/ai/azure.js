import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {Utils} from '../utils/utils.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Utils
const utils = new Utils();
const log = utils.log;

export class MicrosoftAzure {
    constructor(
        AZURE_SPEECH_KEY,
        AZURE_SPEECH_REGION,
        AZURE_SPEECH_LANGUAGE,
        AZURE_SPEECH_VOICE,
    ) {
        this.AZURE_SPEECH_KEY = AZURE_SPEECH_KEY;
        this.AZURE_SPEECH_REGION = AZURE_SPEECH_REGION;
        this.AZURE_SPEECH_LANGUAGE = AZURE_SPEECH_LANGUAGE;
        this.AZURE_SPEECH_VOICE = AZURE_SPEECH_VOICE;

        console.log('MicrosoftAzure loaded');
    }

    // Função para converter texto em áudio usando Microsoft Text-to-Speech API
    tts(text) {
        const apiUrl = `https://${this.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

        // Headers para a requisição
        const headers = [
            'Content-Type: application/ssml+xml', // O conteúdo será enviado em formato SSML
            'X-Microsoft-OutputFormat: riff-24khz-16bit-mono-pcm', // Especifica o formato do áudio
            'Ocp-Apim-Subscription-Key: ' + this.AZURE_SPEECH_KEY, // Chave da API da Azure
        ];

        // Estrutura SSML (Speech Synthesis Markup Language) para definir o texto e a voz
        const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${this.AZURE_SPEECH_LANGUAGE}'>
            <voice name='${this.AZURE_SPEECH_VOICE}'>${text}</voice>
        </speak>
    `;

        // Criar um arquivo temporário para salvar o áudio gerado
        const [success, tempFilePath] = GLib.file_open_tmp(
            'gva_azure_tts_audio_XXXXXX.wav',
        );
        if (!success) {
            log('Error creating temporary audio file.');
            return;
        }

        // Escrever o SSML no arquivo temporário
        try {
            GLib.file_set_contents(tempFilePath, ssml);
        } catch (e) {
            log('Error writing to temporary audio file: ' + e.message);
            return;
        }

        // Usa subprocesso para enviar requisição HTTP com curl, e salvar a resposta (áudio) em um arquivo
        let subprocess = new Gio.Subprocess({
            argv: [
                'curl',
                '-X',
                'POST',
                '-H',
                headers[0], // Content-Type
                '-H',
                headers[1], // X-Microsoft-OutputFormat
                '-H',
                headers[2], // Ocp-Apim-Subscription-Key
                '--data',
                ssml, // Dados a serem enviados (SSML)
                '--output',
                tempFilePath, // Salva o áudio gerado no arquivo temporário
                apiUrl,
            ],
            flags:
                Gio.SubprocessFlags.STDOUT_PIPE |
                Gio.SubprocessFlags.STDERR_PIPE,
        });

        subprocess.init(null);

        // Captura o status da requisição
        subprocess.communicate_utf8_async(null, null, (proc, res) => {
            try {
                // eslint-disable-next-line no-unused-vars
                let [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
                if (ok) {
                    log('Audio file saved to: ' + tempFilePath);

                    // Tocar o áudio gerado
                    this.playAudio(tempFilePath);
                } else {
                    log('Requisition error: ' + stderr);
                }
            } catch (e) {
                log('Error processing response: ' + e.message);
            } finally {
                // Limpeza: pode optar por remover o arquivo temporário após tocar o áudio, se necessário
                // GLib.unlink(tempFilePath);
            }
        });
    }

    // Função para transcrever o áudio gravado usando Microsoft Speech-to-Text API
    transcribe(audioPath) {
        // Carregar o arquivo de áudio em formato binário
        let file = Gio.File.new_for_path(audioPath);
        let [, audioBinary] = file.load_contents(null);

        if (!audioBinary) {
            log('Falha ao carregar o arquivo de áudio.');
            return;
        }

        // Requisição à API do Microsoft Speech-to-Text
        const apiUrl = `https://${this.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.AZURE_SPEECH_LANGUAGE}`;

        // Headers necessários para a requisição
        const headers = [
            'Content-Type: audio/wav', // O arquivo será enviado em formato .wav
            'Ocp-Apim-Subscription-Key: ' + this.AZURE_SPEECH_KEY, // Chave de autenticação
            'Accept: application/json', // A resposta será em JSON
        ];

        // Criar um arquivo temporário para armazenar o áudio binário (opcional)
        const [success, tempFilePath] = GLib.file_open_tmp(
            'gva_azure_att_audio_XXXXXX.wav',
        );
        if (!success) {
            log('Error creating temporary audio file.');
            return;
        }

        // Escrever o áudio binário no arquivo temporário
        try {
            GLib.file_set_contents(tempFilePath, audioBinary);
        } catch (e) {
            log('Erro ao escrever no arquivo temporário: ' + e.message);
            return;
        }

        // Usa subprocesso para enviar requisição HTTP com curl, lendo o áudio do arquivo
        let subprocess = new Gio.Subprocess({
            argv: [
                'curl',
                '-X',
                'POST',
                '-H',
                headers[0], // Content-Type
                '-H',
                headers[1], // Ocp-Apim-Subscription-Key
                '-H',
                headers[2], // Accept
                '--data-binary',
                '@' + tempFilePath, // Enviar o arquivo de áudio binário
                apiUrl,
            ],
            flags:
                Gio.SubprocessFlags.STDOUT_PIPE |
                Gio.SubprocessFlags.STDERR_PIPE,
        });

        subprocess.init(null);

        // Captura a resposta da API
        subprocess.communicate_utf8_async(null, null, (proc, res) => {
            try {
                let [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
                if (ok && stdout) {
                    log('Resposta da API: ' + stdout);
                    let response = JSON.parse(stdout);

                    if (response && response.DisplayText) {
                        let transcription = response.DisplayText;
                        log('Transcrição: ' + transcription);
                        this.aiResponse(transcription); // Função para processar a resposta da transcrição
                    } else {
                        log('Nenhuma transcrição encontrada.');
                    }
                } else {
                    log('Erro na requisição: ' + stderr);
                }
            } catch (e) {
                log('Erro ao processar resposta: ' + e.message);
            } finally {
                // Remove all temp files
                GLib.unlink(audioPath);
                GLib.unlink(tempFilePath);
                this.removeWavFiles();
            }
        });
    }
}
