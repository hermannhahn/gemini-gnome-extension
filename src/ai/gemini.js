import St from 'gi://St';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import {Utils} from '../utils/utils.js';
import {MicrosoftAzure} from '../ai/azure.js';
import {Audio} from '../utils/audio.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Utils
const utils = new Utils();
const log = utils.log;
const logError = utils.logError;

export class GoogleGemini {
    static GEMINIAPIKEY;
    static AZURE_SPEECH_KEY;
    static AZURE_SPEECH_REGION;
    static AZURE_SPEECH_LANGUAGE;
    static AZURE_SPEECH_VOICE;
    static USERNAME;
    static LOCATION;
    static RECURSIVETALK;

    constructor(
        GEMINIAPIKEY,
        AZURE_SPEECH_KEY,
        AZURE_SPEECH_REGION,
        AZURE_SPEECH_LANGUAGE,
        AZURE_SPEECH_VOICE,
    ) {
        this.USERNAME = GLib.get_real_name();
        this.LOCATION = '';
        this.GEMINIAPIKEY = GEMINIAPIKEY;
        this.AZURE_SPEECH_KEY = AZURE_SPEECH_KEY;
        this.AZURE_SPEECH_REGION = AZURE_SPEECH_REGION;
        this.AZURE_SPEECH_LANGUAGE = AZURE_SPEECH_LANGUAGE;
        this.AZURE_SPEECH_VOICE = AZURE_SPEECH_VOICE;
        this.azure = new MicrosoftAzure(
            AZURE_SPEECH_KEY,
            AZURE_SPEECH_REGION,
            AZURE_SPEECH_LANGUAGE,
            AZURE_SPEECH_VOICE,
        );
        this.audio = new Audio(
            AZURE_SPEECH_KEY,
            AZURE_SPEECH_REGION,
            AZURE_SPEECH_LANGUAGE,
            AZURE_SPEECH_VOICE,
        );
        console.log('Gemini Voice Assistant loaded');
    }

    /**
     * @param {*} responseChat
     * @param {*} question
     *
     * @description Send question and show response
     */
    response(responseChat, question) {
        // Create http session
        let _httpSession = new Soup.Session();
        let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${this.GEMINIAPIKEY}`;
        let aiResponse = null;

        // Compose request
        var body = this._buildBody(question);
        let message = Soup.Message.new('POST', url);
        let bytes = GLib.Bytes.new(body);
        message.set_request_body_from_bytes('application/json', bytes);

        // Send async request
        _httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (_httpSession, result) => {
                let bytes = _httpSession.send_and_read_finish(result);
                let decoder = new TextDecoder('utf-8');

                // Get response
                let response = decoder.decode(bytes.get_data());
                let res = JSON.parse(response);
                if (res.error?.code !== 401 && res.error !== undefined) {
                    logError(res.error);
                    aiResponse = 'Sorry, error getting response.';
                }
                // SAFETY warning
                if (res.candidates[0].finishReason === 'SAFETY') {
                    // get safety reason
                    for (
                        let i = 0;
                        i < res.candidates[0].safetyRatings.length;
                        i++
                    ) {
                        let safetyRating = res.candidates[0].safetyRatings[i];
                        if (safetyRating.probability !== 'NEGLIGIBLE') {
                            if (
                                safetyRating.category ===
                                'HARM_CATEGORY_SEXUALLY_EXPLICIT'
                            ) {
                                aiResponse = _(
                                    "Sorry, I can't answer this question. Possible sexually explicit content in the question or answer.",
                                );
                            }
                            if (
                                safetyRating.category ===
                                'HARM_CATEGORY_HATE_SPEECH'
                            ) {
                                aiResponse = _(
                                    "Sorry, I can't answer this question. Possible hate speech in the question or answer.",
                                );
                            }
                            if (
                                safetyRating.category ===
                                'HARM_CATEGORY_HARASSMENT'
                            ) {
                                aiResponse = _(
                                    "Sorry, I can't answer this question. Possible harassment in the question or answer.",
                                );
                            }
                            if (
                                safetyRating.category ===
                                'HARM_CATEGORY_DANGEROUS_CONTENT'
                            ) {
                                aiResponse = _(
                                    "Sorry, I can't answer this question. Possible dangerous content in the question or answer.",
                                );
                            }
                        }
                    }
                }

                aiResponse = res.candidates[0]?.content?.parts[0]?.text;

                if (aiResponse !== null && aiResponse !== undefined) {
                    aiResponse = utils.textformat(aiResponse);
                    // Set ai response to chat
                    responseChat.label.clutter_text.set_markup(
                        '<b>Gemini: </b> ' + aiResponse,
                    );
                    log(aiResponse);

                    // Extract code and tts from response
                    let answer = utils.extractCodeAndTTS(
                        aiResponse,
                        this.AZURE_SPEECH_LANGUAGE,
                    );

                    // Speech response
                    if (answer.tts !== null) {
                        this.azure.tts(answer.tts);
                    }

                    // If answer.code is not null, copy to clipboard
                    if (answer.code !== null) {
                        this.extension.clipboard.set_text(
                            St.ClipboardType.CLIPBOARD,
                            answer.code,
                        );
                    }
                }
            },
            (error, debug) => {
                logError(error);
                log(debug);
                aiResponse = 'Sorry, error getting response.';
            },
        );
    }

    /**
     *
     * @param {*} input
     * @returns
     *
     * @description Build body for AI request
     */
    _buildBody(input) {
        const stringfiedHistory = JSON.stringify([
            ...utils.loadHistoryFile(),
            {
                role: 'user',
                parts: [{text: input}],
            },
        ]);
        return `{"contents":${stringfiedHistory}}`;
    }
}
