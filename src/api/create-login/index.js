const AWS = require("aws-sdk");
const UUID = require('uuid');
const FV = require('./field-verifier.js');

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
    if(login.userName == null || login.password == null || login.passwordRepeated == null) {
        console.error("login.userName, password or repeatedPassword was missing!"); respondError(origin, 500, "Failed to create login(0)", callback); 
    }
    
    getLogin(login.userName, (err, data) => {
        if(err) { console.error(err); respondError(origin, 500, "Failed to create login(1)", callback); }
        else {    
            if(data != null) {
                console.log("Found the following user information while checking for existing login:");
                console.log(JSON.stringify(data));        
            }
            if(data != null && data.userName != null && data.userName.S == login.userName) { console.error(err); respondError(origin, 500, "User name already exists", callback); }
            else {
                createLogin(login, (err,data) => {
                    if(err) { console.error(err); respondError(origin, 500, "Failed to create login(2)", callback); }
                    else {
                        respondOK(origin, data, callback);
                        /*insertInitialData(data.userGuid, (err) => {
                            if(err) { console.error(err); respondError(origin, 500, "Failed to create login(3)", callback); }
                            else respondOK(origin, data, callback);
                        })*/                        
                    }
                });
            }
        }
    });
};

function createLogin(login, callback) {
    var userGuid = UUID.v4();
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: LOGIN_TABLE_NAME,
        Item: {
          'userName': {S: login.userName},
          'userGuid': {S: userGuid},
          'password': {S: login.password},
          'accessToken': {S: ""}
        },
        ReturnConsumedCapacity: "TOTAL", 
        //ProjectionExpression: 'ATTRIBUTE_NAME'
    };    
    ddb.putItem(params, function(err, userData) {
        if (err) { console.log(err); callback(err, null); }
        else {       
            console.log("User created");
            callback(null, { "userGuid": userGuid });
        }
    });    
}

function insertInitialData(userGuid, callback) {
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: HERO_TABLE_NAME,
        Item: {
          'userGuid': {S: userGuid}
          //'heroGuids': {SS: []}
        },
        ReturnConsumedCapacity: "TOTAL", 
        //ProjectionExpression: 'ATTRIBUTE_NAME'
    };    
    ddb.putItem(params, function(err, userData) {
        if (err) { console.error(err); callback(err); }
        else {       
            console.log("Inserted initial score");
            callback(null);
        }
    });    
}

function getLogin(userName, callback) {
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    
    var params = {
      TableName: LOGIN_TABLE_NAME,
      Key: {
        'userName': {S: userName}
      },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };
    
    ddb.getItem(params, function(err, userLoginData) {
       if (err) { console.error(err); callback(err, null); }
       else {
            callback(null, userLoginData.Item);
       }
    });
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
        body: JSON.stringify({ response: 'Login created', data: data }),
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
