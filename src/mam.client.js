const Mam = require('@iota/mam');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter');
const defaultProvider = "https://node-iota.org:14267";

class MamClient {

    constructor (mode = "public", seed = null, sidekey = null, provider = defaultProvider, security = 3) {
        this._mode = mode;
        this._security = security;
        this._sidekey = sidekey ? sidekey : undefined;
        this._provider = provider;
        this._seed = seed ? seed : undefined;

        //Create new Mam-State
        this._mamState = Mam.init ({
            provider: this._provider,
        }, this._seed, this._security);
        this._mamState = Mam.changeMode (this.state, this.mode, this._sidekey);
    }

    static constructByState (stateObject, provider = defaultProvider) {
        const mamHelper = new MamClient (
            stateObject.channel.mode,
            stateObject.seed,
            stateObject.channel.side_key,
            provider,
            stateObject.channel.security
        );
        mamHelper._mamState = stateObject;
        return mamHelper;
    }

    async updateState () {
        let newState = {
            ...this.state
        };
        const results = await this.fetchMessages ();
        newState.channel.next_root = results.nextRoot;
        newState.channel.start = results.messages.length;
        this._mamState = newState;
    }

    get mode () {
        return this._mode;
    }

    get state () {
        return this._mamState;
    }

    get root () {
        return Mam.getRoot (this.state);
    }

    get message () {
        return this._message;
    }

    setMessage (details) {
        //Make the detail in correct format
        if (typeof details !== "object") {
            details = {
                message: String (details),
            };
        }

        //Format the details 
        const trytes = asciiToTrytes (JSON.stringify(details));
        this._message = Mam.create (this.state, trytes);
        this._mamState = this._message.state;
    }

    readMessage (payload) {
        return Mam.decode (
            payload,
            this._sidekey,
            this.root
        );
    }

    subscribe (channelRoot, channelMode = "public", channelKey = null) {
        this._mamState = Mam.subscribe(this.state, channelRoot, channelMode, channelKey)
    }

    listen (_callback) {
        Mam.listen (
            this.state.channel,
            _callback
        );
    }

    async attachMessage (tag = "", depth = 3, minWeightMagnitude = 14) {
        return await Mam.attach(
            this._message.payload, 
            this._message.address, 
            depth, 
            minWeightMagnitude, 
            tag ? asciiToTrytes (tag) : null
        );
    }

    async fetchMessages (limit = undefined) {
        const result = await Mam.fetch(this.root, this._mode, this._sidekey, undefined, limit);
        const messages = result.messages;
        const decodedMessages = [];
        for (const message of messages) {
            decodedMessages.push (this._decodeMessagePayload (message));
        }
        return {
            ...result,
            payloads: messages,
            messages: decodedMessages,
        }
    }

    async fetchMessage () {
        const result = await Mam.fetchSingle(this.root, this._mode, this._sidekey);
        return {
            ...result,
            message: this._decodeMessagePayload (result.payload),
        };
    }

    _decodeMessagePayload (payload) {
        const messageString = trytesToAscii (payload);
        try {
            return JSON.parse (messageString);
        } catch (e) {
            return messageString;
        }
    }

}

module.exports = MamClient;