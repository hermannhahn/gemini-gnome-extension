import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import {convertMD} from './utils/md2pango.js';
import {Utils} from './utils/utils.js';

// Utils
const utils = new Utils();
const log = utils.log;
const logError = utils.logError;

export default class GoogleGemini {
    static GEMINIAPIKEY;
    static AZURE_SPEECH_KEY;
    static AZURE_SPEECH_REGION;
    static AZURE_SPEECH_LANGUAGE;
    static AZURE_SPEECH_VOICE;
    static USERNAME;
    static LOCATION;
    static RECURSIVETALK;
    3;
    constructor(
        GEMINIAPIKEY,
        AZURE_SPEECH_KEY,
        AZURE_SPEECH_REGION,
        AZURE_SPEECH_LANGUAGE,
        AZURE_SPEECH_VOICE,
    ) {
        console.log('Gemini Voice Assistant loaded');
        this.USERNAME = GLib.get_real_name();
        this.LOCATION = '';
        this.GEMINIAPIKEY = GEMINIAPIKEY;
        this.AZURE_SPEECH_KEY = AZURE_SPEECH_KEY;
        this.AZURE_SPEECH_REGION = AZURE_SPEECH_REGION;
        this.AZURE_SPEECH_LANGUAGE = AZURE_SPEECH_LANGUAGE;
        this.AZURE_SPEECH_VOICE = AZURE_SPEECH_VOICE;
    }

    /**
     *
     * @param {*} question
     *
     * @description Send question and show response and response options
     */
    aiResponse(question) {
        // Create http session
        let _httpSession = new Soup.Session();
        let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${this.GEMINIAPIKEY}`;

        // Send async request
        var body = this._buildBody(question);
        let message = Soup.Message.new('POST', url);
        let bytes = GLib.Bytes.new(body);
        message.set_request_body_from_bytes('application/json', bytes);
        _httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (_httpSession, result) => {
                let bytes = _httpSession.send_and_read_finish(result);
                let decoder = new TextDecoder('utf-8');

                // Get response
                let response = decoder.decode(bytes.get_data());
                log('[ AI-RES ] ' + response);
                let res = JSON.parse(response);
                if (res.error?.code !== 401 && res.error !== undefined) {
                    logError(res.error);
                    return 'Sorry, error getting response.';
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
                                return _(
                                    "Sorry, I can't answer this question. Possible sexually explicit content in the question or answer.",
                                );
                            }
                            if (
                                safetyRating.category ===
                                'HARM_CATEGORY_HATE_SPEECH'
                            ) {
                                return _(
                                    "Sorry, I can't answer this question. Possible hate speech in the question or answer.",
                                );
                            }
                            if (
                                safetyRating.category ===
                                'HARM_CATEGORY_HARASSMENT'
                            ) {
                                return _(
                                    "Sorry, I can't answer this question. Possible harassment in the question or answer.",
                                );
                            }
                            if (
                                safetyRating.category ===
                                'HARM_CATEGORY_DANGEROUS_CONTENT'
                            ) {
                                return _(
                                    "Sorry, I can't answer this question. Possible dangerous content in the question or answer.",
                                );
                            }
                        }
                    }
                }

                let aiResponse = res.candidates[0]?.content?.parts[0]?.text;

                if (aiResponse !== null && aiResponse !== undefined) {
                    let convertedResponse = convertMD(aiResponse);
                    let formatedResponse = utils.format(convertedResponse);

                    // Return AI response
                    return formatedResponse;
                }
                return 'Sorry, error getting response.';
            },
        );
    }

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
