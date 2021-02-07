const AWS = require("aws-sdk");
const UUID = require('uuid');
const FV = require('./field-verifier.js');
const MAX_TURNS = 50;
var { HeroDTO } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
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

    //var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var requestInput = JSON.parse(event.body);
    
    HeroDAO.getAll(requestInput.userGuid, (err, heroDTOs) => {
        if(err) { Logger.logError(err); respondError(origin, 500, "Failed to create hero(1):" + err, callback); return; }
            if(heroDTOs != null && heroDTOs.length > 2) { Logger.logError("You already have three heroes, delete one first."); respondError(origin, 500, "You already have three heroes, delete one first.", callback); return; }
            //HeroDAO.get(requestInput.userGuid, requestInput.hero.heroName, (err, heroData) => {
                //if(err) { Logger.logError(err); respondError(origin, 500, "Failed to create hero(1):" + err, callback); }
                //else {
                    //Logger.logInfo("heroData=" + JSON.stringify(heroData));
        if(heroDTOs.length>0) {
            Logger.logInfo("Checking for existing hero name");
            for(var i=0;i<heroDTOs.length;i++) {
                if(requestInput.hero.heroName == heroDTOs[i].heroName) { Logger.logError("Hero name already exists"); respondError(origin, 500, "Hero name already exists", callback); return; }
            }
        }
        HeroDAO.save(requestInput.userGuid, new HeroDTO(requestInput.hero), (err,newHeroData) => {
            if(err) { Logger.logError(err); respondError(origin, 500, "Failed to create hero(2):" + err, callback); }
            else respondOK(origin, newHeroData, callback);
        });
                //}
            //});
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
        body: JSON.stringify({ response: 'Hero created', data: data }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : tweakOrigin(origin),
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}

function respondError(origin, errorCode, errorMessage, callback) {
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
