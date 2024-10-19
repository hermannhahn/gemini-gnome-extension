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
}
