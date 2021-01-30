const AWS = require("aws-sdk");
const FV = require('./field-verifier.js');
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");

const MAX_TURNS = 50;
const LOGIN_TABLE_NAME = "om-hq-login";
const HERO_TABLE_NAME = "om-hq-hero"
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
    
    /*var params = {
      TableName: LOGIN_TABLE_NAME,
      Key: {
        'userName': {S: requestInput.userName}
      },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };*/
    
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

function getHeroe2s(userGuid, callback) {
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    Logger.logInfo("Getting data via query operation...");
    ddb.query({
        TableName: HERO_TABLE_NAME,
        KeyConditionExpression: "userGuid = :userGuid and heroName = :heroName", // "userGuid = :userGuid and heroName = :heroName",
        ExpressionAttributeValues: {
            ":userGuid": {S: requestInput.userGuid},
            ":heroName": {S: requestInput.hero.heroName},            
        }
    },
    (err, heroData) => {
        if(err) { callback(err, null); return; }
        Logger.logInfo("Got these data via statement:");
        Logger.logInfo(JSON.stringify(heroData));
        callback(null, heroData);
    })

    /*ddb.scan({
        TableName: HERO_TABLE_NAME        
    },
    (err, heroData) => {
        if(err) { Logger.logError("Scan failed."); callback(err, null); }
        Logger.logInfo("Scan operation got hero data:");
        Logger.logInfo(JSON.stringify(heroData));
        callback(null, { herores: heroData.Items });
    });*/
    
    /*ddb.query({
        TableName: HERO_TABLE_NAME
    },
    (err, data) => {
        Logger.logInfo("got hero data");
        Logger.logInfo(JSON.stringify(data));
    });*/

    /*ddb.executeStatement({
        Statement: "select * from om-hq-hero where userGuid=:userGuid order by heroName",
        Parameters: [{ }]
    }, 
    (err, data) => {

    });*/
    /*var params = {
      TableName: HERO_TABLE_NAME,
      Key: {
        'userGuid': {S: userGuid},
        'heroName': {S: userGuid}
      },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };
    
    ddb.getItem(params, function(err, heroData) {
       if (err) { Logger.logError(err); throw err; }
       else {
            if(heroData == null || heroData.Item == null || heroData.Item.score == null)
                callback({}); // No heroes created yet
            else
                callback(heroData.Item);
       }
    });*/
}

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
