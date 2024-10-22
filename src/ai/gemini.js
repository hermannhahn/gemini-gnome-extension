import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import {Utils} from '../utils/utils.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Utils
const utils = new Utils();
const log = utils.log;
const logError = utils.logError;

export class GoogleGemini {
    static GEMINIAPIKEY;

    constructor(GEMINIAPIKEY) {
        this.GEMINIAPIKEY = GEMINIAPIKEY;
        this.chatHistory = utils.loadHistoryFile();
        console.log('Gemini Voice Assistant loaded');
    }

    /**
     * @param {*} question
     *
     * @description Return ai response
     */
    response(question) {
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
                aiResponse = res.candidates[0]?.content?.parts[0]?.text;

                // SAFETY warning
                if (res.candidates[0].finishReason === 'SAFETY') {
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
            },
            (error, debug) => {
                logError(error);
                log(debug);
                return error;
            },
        );
        aiResponse = utils.textformat(aiResponse);
        return aiResponse;
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
            ...this.chatHistory,
            {
                role: 'user',
                parts: [{text: input}],
            },
        ]);
        return `{"contents":${stringfiedHistory}}`;
    }
}
