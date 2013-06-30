const Applet = imports.ui.applet;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Json = imports.gi.Json;
const Mainloop = imports.mainloop;
const Gettext = imports.gettext.domain("cinnamon-applets");
const _ = Gettext.gettext;

const UUID = "cinnamon-location@mindcruzer.com";
const GEO_IP_URL = 'http://api.ipinfodb.com/v3/ip-city/?key=d115c954db28487f38c5d25d5dcf62a5786479b87cc852cabe8fd6f1971d7f89&format=json';

const _httpSession = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());


// Logging
// ----------
function log(message) {
    global.log(UUID + '#' + log.caller.name + ': ' + message);
}

function logError(error) {
    global.logError(UUID + '#' + logError.caller.name + ': ' + error);
}


// Applet
// ----------
function MyApplet(orientation) {
    this._init(orientation);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function (orientation) {
        Applet.TextIconApplet.prototype._init.call(this, orientation);

        try {
            this.set_applet_icon_name("emblem-web");
            this.set_applet_tooltip(_("Your percieved location."));
            this.set_applet_label("...");
        }
        catch (error) {
            logError(error);
        }

        this.refreshLocation();
    },

    loadJsonAsync: function loadJsonAsync(url, callback) {
        let context = this;
        let message = Soup.Message.new('GET', url);
        
        _httpSession.queue_message(message, function soupQueue(session, message) {
            let jp = new Json.Parser();
            jp.load_from_data(message.response_body.data, -1);
            callback.call(context, jp.get_root().get_object());
        });
    },

    refreshLocation: function refreshLocation() {
        log('Requesting location from IPInfoDB...');

        this.loadJsonAsync(GEO_IP_URL, function locationCallback (json) {
            let cityName = json.get_string_member('cityName');
            cityName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
            
            log(cityName);
            this.set_applet_label(cityName);
           
            Mainloop.timeout_add_seconds(60, Lang.bind(this, function refreshTimeout() {
                this.refreshLocation();
            }));
        });
    }
};

function main(metadata, orientation) {
    let myapplet = new MyApplet(orientation);
    return myapplet;
}