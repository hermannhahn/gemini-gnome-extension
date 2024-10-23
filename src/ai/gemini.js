import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import {Utils} from '../utils/utils.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Utils
const utils = new Utils();
const logError = utils.logError;

export class GoogleGemini {
    static aiva;

    constructor(aiva) {
        this.aiva = aiva;
        this.USERNAME = aiva.USERNAME;
        this.LOCATION = aiva.LOCATION;
        this.GEMINIAPIKEY = aiva.GEMINIAPIKEY;
        console.log('Gemini Voice Assistant loaded');
    }

    /**
     *
     * @param {*} userQuestion
     */
    chat(userQuestion) {
        // Add ai temporary response to chat
        this.aiva.responseChat.label.clutter_text.set_markup(
            '<b>Gemini: </b> ...',
        );

        // Get ai response for user question
        this.response(userQuestion);

        // Response
        this.aiva.responseChat.label.clutter_text.reactive = true;
        this.aiva.responseChat.label.clutter_text.selectable = true;
        this.aiva.responseChat.label.clutter_text.hover = false;
        this.aiva.responseChat.label.x_expand = true;

        // Scroll down
        utils.scrollToBottom(this.aiva.responseChat, this.aiva.scrollView);

        // Add copy button to chat
        this.chatSection.addMenuItem(this.aiva.copyButton);

        // Scroll down
        utils.scrollToBottom(this.aiva.responseChat, this.aiva.scrollView);
    }

    /**
     * @param {object} userQuestion
     *
     * @description Send question and add response to chat
     */
    response(userQuestion) {
        // Create http session
        let _httpSession = new Soup.Session();
        let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${this.GEMINIAPIKEY}`;
        let aiResponse = '...';

        // Compose request
        var body = this._buildBody(userQuestion);
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
                // DEBUG
                // aiResponse =
                //     'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius lacinia, lectus quam laoreet libero, at laoreet lectus lectus eu quam. Maecenas vitae lacus sit amet justo ultrices condimentum. Maecenas id dolor vitae quam semper blandit. Aenean sed sapien ut ante elementum bibendum. Sed euismod, nisl id varius la';
                if (aiResponse !== undefined) {
                    aiResponse = utils.textformat(aiResponse);
                    this.aiva.responseChat.label.clutter_text.set_markup(
                        '<b>Gemini: </b> ' + aiResponse,
                    );
                    this.aiva.searchEntry.clutter_text.reactive = true;

                    this.chatHistory.push({
                        role: 'user',
                        parts: [{text: this.userQuestion}],
                    });

                    this.chatHistory.push({
                        role: 'model',
                        parts: [{text: aiResponse}],
                    });

                    // Save history.json
                    if (this.aiva.recursiveTalk) {
                        utils.saveHistory(this.aiva.chatHistory);
                    }
                }
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
            ...this.chatHistory,
            {
                role: 'user',
                parts: [{text: input}],
            },
        ]);
        return `{"contents":${stringfiedHistory}}`;
    }
}
