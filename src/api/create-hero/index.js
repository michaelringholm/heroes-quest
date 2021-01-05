const AWS = require("aws-sdk");
const UUID = require('uuid');
const MAX_TURNS = 50;
const LOGIN_TABLE_NAME = "om-hq-login";
const HERO_TABLE_NAME = "om-hq-hero"

// Callback is (error, response)
exports.handler = function(event, context, callback) {
    console.log(JSON.stringify(event));
    //AWS.config.update({region: 'eu-central-1'});
    var method = event.requestContext.http.method;
    if(method == "OPTIONS") {
        respondOK({}, callback);
        return;
    }
    console.log("method="+method);

    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var hero = JSON.parse(event.body);
    if(login.userName == null || login.password == null || login.passwordRepeated == null) {
        console.error("login.userName, password or repeatedPassword was missing!"); respondError(500, "Failed to create login(0)", callback); 
    }
    
    getLogin(login.userName, (err, data) => {
        if(err) { console.error(err); respondError(500, "Failed to create login(1)", callback); }
        else {
            console.log("Found the following user information while checking for existing login:");
            console.log(JSON.stringify(data));
            if(data != null && data.userName != null && data.userName.S == login.userName) { console.error(err); respondError(500, "User name already exists", callback); }
            else {
                createLogin(login, (err,data) => {
                    if(err) { console.error(err); respondError(500, "Failed to create login(2)", callback); }
                    else respondOK(data, callback);
                });
            }
        }
    });
};

function createLogin(hero, callback) {
    var userGuid = UUID.v4();
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: HERO_TABLE_NAME,
        Item: {
          'userGuid': {S: hero.userGuid},
          'heroName': {S: hero.heroName},
          'heroClass': {S: hero.HeroClass}
        },
        ReturnConsumedCapacity: "TOTAL", 
        //ProjectionExpression: 'ATTRIBUTE_NAME'
    };    
    ddb.putItem(params, function(err, userData) {
        if (err) { console.log(err); callback(err, null); }
        else {       
            console.log("Hero created");
            callback(null, { "userGuid": userGuid });
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

function respondOK(data, callback) {
    const response = {
        statusCode: 200,
        body: JSON.stringify({ response: 'Login created', data: data }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}

function respondError(errorCode, errorMessage, callback) {
    const response = {
        statusCode: errorCode,
        body: JSON.stringify({ response: errorMessage }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin' : "*", // Required for CORS support to work
            'Access-Control-Allow-Credentials' : true, // Required for cookies, authorization headers with HT
            'Access-Control-Allow-Headers' : "content-type"
        },
    };
    callback(null, response);
}
