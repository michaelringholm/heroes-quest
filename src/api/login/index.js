const AWS = require("aws-sdk");
const UUID = require('uuid');
const MAX_TURNS = 50;
const LOGIN_TABLE_NAME = "om-hq-login";
const HERO_TABLE_NAME = "om-hq-hero"
const ALLOWED_ORIGINS = ["http://localhost", "http://aws..."]

// Callback is (error, response)
exports.handler = function(event, context, callback) {
    console.log(JSON.stringify(event));
    //AWS.config.update({region: 'eu-central-1'});
    var method = event.requestContext.http.method;
    var origin = event.headers.origin;
    var referer = event.headers.referer;
    if(method == "OPTIONS") {
        preFlightResponse(origin, referer, callback);
        return;
    }
    console.log("method="+method);

    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var login = JSON.parse(event.body);
    
    var params = {
      TableName: LOGIN_TABLE_NAME,
      Key: {
        'userName': {S: login.userName}
      },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };
    
    ddb.getItem(params, function(err, userData) {
       if (err) { console.log(err); respondError(origin, 500, err, callback); }
       else {
            console.log(JSON.stringify(userData));
            if(userData == null || userData.Item == null || userData.Item.password == null) {
                console.error("User [" + login.userName + "] not found");
                respondError(origin, 401, "Invalid login", callback);
            }
            else {
                if(userData.Item.password.S == login.password) {
                    console.log("Password accepted");
                    updateToken(login, userData.Item.userGuid.S, ddb, function(err, tokenData) {
                        if (err) { console.log(err); respondError(origin, 500, err, callback); }
                        else {
                            getHeroInfo(userData.Item.userGuid.S, function(scoreData) {
                                scoreData.maxTurns = MAX_TURNS;
                                scoreData.accessToken = tokenData.accessToken;
                                scoreData.userGuid = tokenData.userGuid;
                                respondOK(origin, scoreData, callback);
                            });
                        }
                    });
                }
                else {
                    console.error("Wrong password, was [" + login.password + "] exptected [" + userData.Item.password.S + "]");
                    respondError(origin, 401, "Invalid login", callback);
                }
            }
       }
    });
};

function updateToken(login, userGuid, ddb, callback) {
    var newToken = UUID.v4();
    var params = {
        TableName: LOGIN_TABLE_NAME,
        Item: {
          'userName': {S: login.userName},
          'userGuid': {S: userGuid},
          'password': {S: login.password},
          'accessToken': {S: newToken}
        },
        ReturnConsumedCapacity: "TOTAL", 
        //ProjectionExpression: 'ATTRIBUTE_NAME'
    };    
    ddb.putItem(params, function(err, userData) {
        if (err) { console.log(err); callback(err, null); }        
        console.log("New token generated");
        callback(null, { "accessToken": newToken, "userGuid": userGuid });
    });    
}

function getHeroInfo(userGuid, callback) {
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    
    var params = {
      TableName: HERO_TABLE_NAME,
      Key: {
        'userGuid': {S: userGuid}
      },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };
    
    ddb.getItem(params, function(err, userData) {
       if (err) { console.error(err); throw err; }
       else {
            if(userData == null || userData.Item == null || userData.Item.score == null)
                callback({}); // First round no data yet
            else
                callback(userData.Item);
       }
    });
}

function preFlightResponse(origin, referer, callback) {
    var tweakedOrigin = "";
    if(origin == ALLOWED_ORIGINS[0] || origin == ALLOWED_ORIGINS[1])
        tweakedOrigin = origin;

    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' :   tweakedOrigin,
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}

function respondOK(origin, data, callback) {
    var tweakedOrigin = "";
    if(origin == ALLOWED_ORIGINS[0] || origin == ALLOWED_ORIGINS[1])
        tweakedOrigin = origin;

    const response = {
        statusCode: 200,
        body: JSON.stringify({ response: 'Login completed', data: data }),
        headers: {
            'Content-Type': 'application/json',
            //'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
            'Access-Control-Allow-Origin' : tweakedOrigin,
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
            'Access-Control-Allow-Origin' : tweakedOrigin, // Required for CORS support to work
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}
