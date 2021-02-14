var AppContext = require('./AppContext.js');

function HttpController() {
    var _this = this;

    this.tweakOrigin = function(origin) {
        var tweakedOrigin = "-";        
        AppContext.ALLOWED_ORIGINS.forEach(allowedOrigin => {
            if(allowedOrigin == origin) tweakedOrigin = origin;
        });
        return tweakedOrigin;
    }

    this.preFlightResponse = function(origin, referer, callback) {
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin' :   _this.tweakOrigin(origin),
                'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
                'Access-Control-Allow-Headers' : "content-type"
            },
        };
        callback(null, response);
    }

    this.respondOK = function(origin, data, callback) {
        const response = {
            statusCode: 200,
            body: JSON.stringify({ response: 'Success', data: data }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin' : _this.tweakOrigin(origin),
                'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
                'Access-Control-Allow-Headers' : "content-type"
            },
        };
        callback(null, response);
    }

    this.respondError = function(origin, errorCode, errorMessage, callback) {
        const response = {
            statusCode: errorCode,
            body: JSON.stringify({ response: errorMessage }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin' : _this.tweakOrigin(origin),
                'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
                'Access-Control-Allow-Headers' : "content-type"
            },
        };
        callback(null, response);
    }
}

module.exports = new HttpController(); // Singleton