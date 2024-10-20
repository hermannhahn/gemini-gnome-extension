import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {Utils} from './utils/utils.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Utils
const utils = new Utils();
const log = utils.log;

export default class Audio {
    constructor() {
        console.log('Audio loaded');
        // Global variables
        this.pipeline = null;
        this.isRecording = false;
        this.isPlaying = false;
        this.playingPid = null;
    }

    // Play audio
    play(audiofile) {
        if (!this.isPlaying) {
            log('Playing audio: ' + audiofile);
            // Process sync, not async
            const process = GLib.spawn_async(
                null, // pasta de trabalho
                ['/bin/sh', '-c', `play ${audiofile}`], // comando e argumentos
                null, // opções
                GLib.SpawnFlags.SEARCH_PATH, // flags
                null, // PID
            );
            if (process) {
                this.playingPid = process.pid;
                this.isPlaying = true;
                log('Audio played successfully.');
            } else {
                log('Error playing audio.');
            }
        } else {
            log('Audio already playing.');
            this.stop();
            this.play(audiofile);
        }
    }

    // Stop audio
    stop() {
        if (!this.isPlaying) {
            return;
        }
        // Kill player pid
        GLib.spawn_command_line_async('kill ' + this.playingPid);
        this.isPlaying = false;
        log('Stopping audio.');
    }

    // Start record
    record() {
        if (this.isRecording) {
            // Stop recording
            this.stopRecord();
            return;
        }

        // Definir o arquivo de saída no diretório da extensão
        this.outputPath = 'gva_temp_audio_XXXXXX.wav';

        // Pipeline GStreamer para capturar áudio do microfone e salvar como .wav
        this.pipeline = new Gio.Subprocess({
            argv: [
                'gst-launch-1.0',
                'pulsesrc',
                '!',
                'audioconvert',
                '!',
                'wavenc',
                '!',
                'filesink',
                `location=${this.outputPath}`,
            ],
            flags:
                Gio.SubprocessFlags.STDOUT_PIPE |
                Gio.SubprocessFlags.STDERR_PIPE,
        });

        this.pipeline.init(null);
        this.isRecording = true;
    }

    // Stop record
    stopRecord() {
        if (!this.isRecording) {
            return;
        }

        // Stop recording
        this.pipeline.force_exit();
        this.isRecording = false;
    }

    // Função para converter arquivo de áudio em base64
    encodeFileToBase64(filePath) {
        try {
            const file = Gio.File.new_for_path(filePath);
            const [, contents] = file.load_contents(null);
            return GLib.base64_encode(contents);
        } catch (error) {
            log('Erro ao ler o arquivo: ' + error);
            return null;
        }
    }
}
