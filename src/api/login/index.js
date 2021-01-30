const AWS = require("aws-sdk");
const FV = require('./field-verifier.js');
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");

const MAX_TURNS = 50;
const ALLOWED_ORIGINS = ["http://localhost", "http://aws..."]

// Callback is (error, response)
exports.handler = function(event, context, callback) {
    Logger.logInfo(JSON.stringify(event));
    //AWS.config.update({region: 'eu-central-1'});
    var method = event.requestContext.http.method;
    var origin = event.headers.origin;
    var referer = event.headers.referer;
    if(method == "OPTIONS") {
        preFlightResponse(origin, referer, callback);
        return;
    }
    Logger.logInfo("method="+method);

    var requestInput = JSON.parse(event.body);
    LoginDAO.get(requestInput.userName, function(err, loginDTO) {
       if (err) { Logger.logInfo(err); respondError(origin, 500, err, callback); }
       else {
            Logger.logInfo("loginDTO=" + JSON.stringify(loginDTO));
            if(loginDTO == null || loginDTO.userName == null || loginDTO.password == null) {
                Logger.logError("User [" + requestInput.userName + "] not found");
                respondError(origin, 401, "Invalid login", callback);
            }
            else {
                if(loginDTO.password == requestInput.password) {
                    Logger.logInfo("Password accepted");
                    LoginDAO.updateToken(loginDTO, function(err, updatedLoginDTO) {
                        if (err) { Logger.logInfo(err); respondError(origin, 500, err, callback); }
                        else {
                            HeroDAO.getAll(loginDTO.userGuid, function(err, heroesData) {
                                if (err) { Logger.logInfo(err); respondError(origin, 500, err, callback); }
                                var responseData = { heroes: heroesData.Items };
                                Logger.logInfo("Received this data from getHeroes():", JSON.stringify(heroesData));
                                responseData.maxTurns = MAX_TURNS;
                                responseData.accessToken = updatedLoginDTO.accessToken;
                                responseData.userGuid = updatedLoginDTO.userGuid;
                                respondOK(origin, responseData, callback);
                            });
                        }
                    });
                }
                else {
                    Logger.logError("Wrong password, was [" + requestInput.password + "] exptected [" + loginDTO.password.S + "]");
                    respondError(origin, 401, "Invalid login", callback);
                }
            }
       }
    });
};

function tweakOrigin(origin) {
    var tweakedOrigin = "-";
    ALLOWED_ORIGINS.forEach(allowedOrigin => {
        if(allowedOrigin == origin) tweakedOrigin = origin;
    });
    return tweakedOrigin;
}

function preFlightResponse(origin, referer, callback) {
    var tweakedOrigin = "";
    if(origin == ALLOWED_ORIGINS[0] || origin == ALLOWED_ORIGINS[1])
        tweakedOrigin = origin;

    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' :   tweakOrigin(origin),
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}

function respondOK(origin, data, callback) {
    const response = {
        statusCode: 200,
        body: JSON.stringify({ response: 'Login completed', data: data }),
        headers: {
            'Content-Type': 'application/json',
            //'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
            'Access-Control-Allow-Origin' : tweakOrigin(origin),
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}

function respondError(origin, errorCode, errorMessage, callback) {
    var tweakedOrigin = "";
    if(origin == ALLOWED_ORIGINS[0] || origin == ALLOWED_ORIGINS[1])
        tweakedOrigin = origin;

    const response = {
        statusCode: errorCode,
        body: JSON.stringify({ response: errorMessage }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : tweakOrigin(origin),
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}
