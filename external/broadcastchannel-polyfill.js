/*!
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
 */
(function(global) {
    var channels = [];

    function BroadcastChannel(channel) {
        var $this = this;
        channel = String(channel);

        var id = '$BroadcastChannel$' + channel + '$';

        channels[id] = channels[id] || [];
        channels[id].push(this);

        this._name = channel;
        this._id = id;
        this._closed = false;
        this._mc = new MessageChannel();
        this._mc.port1.start();
        this._mc.port2.start();

        global.addEventListener('storage', function(e) {
            if (e.storageArea !== global.localStorage) return;
            if (e.newValue == null || e.newValue === '') return;
            if (e.key.substring(0, id.length) !== id) return;
            var data = JSON.parse(e.newValue);
            $this._mc.port2.postMessage(data);
        });
    }

    BroadcastChannel.prototype = {
        // BroadcastChannel API
        get name() {
            return this._name;
        },
        postMessage: function(message) {
            var $this = this;
            if (this._closed) {
                var e = new Error();
                e.name = 'InvalidStateError';
                throw e;
            }
            var value = JSON.stringify(message);

            // Broadcast to other contexts via storage events...
            var key = this._id + String(Date.now()) + '$' + String(Math.random());
            global.localStorage.setItem(key, value);
            setTimeout(function() {
                global.localStorage.removeItem(key);
            }, 500);

            // Broadcast to current context via ports
            channels[this._id].forEach(function(bc) {
                if (bc === $this) return;
                bc._mc.port2.postMessage(JSON.parse(value));
            });
        },
        close: function() {
            if (this._closed) return;
            this._closed = true;
            this._mc.port1.close();
            this._mc.port2.close();

            var index = channels[this._id].indexOf(this);
            channels[this._id].splice(index, 1);
        },

        // EventTarget API
        get onmessage() {
            return this._mc.port1.onmessage;
        },
        set onmessage(value) {
            this._mc.port1.onmessage = value;
        },
        addEventListener: function(/*type, listener , useCapture*/) {
            return this._mc.port1.addEventListener.apply(this._mc.port1, arguments);
        },
        removeEventListener: function(/*type, listener , useCapture*/) {
            return this._mc.port1.removeEventListener.apply(this._mc.port1, arguments);
        },
        dispatchEvent: function(/*event*/) {
            return this._mc.port1.dispatchEvent.apply(this._mc.port1, arguments);
        },
    };

    global.BroadcastChannel = global.BroadcastChannel || BroadcastChannel;
})(self);
