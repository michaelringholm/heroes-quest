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
    var requestInput = JSON.parse(event.body);
    
    var params = {
      TableName: LOGIN_TABLE_NAME,
      Key: {
        'userName': {S: requestInput.userName}
      },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };
    
    console.log("Step(1)");
    ddb.getItem(params, function(err, userData) {
        console.log("Step(2)");
       if (err) { console.log(err); respondError(origin, 500, err, callback); }
       else {
            console.log("Step(3)");
            console.log(JSON.stringify(userData));
            if(userData == null || userData.Item == null || userData.Item.password == null) {
                console.log("Step(4)");
                console.error("User [" + requestInput.userName + "] not found");
                respondError(origin, 401, "Invalid login", callback);
            }
            else {
                console.log("Step(5)");
                if(userData.Item.password.S == requestInput.password) {
                    console.log("Password accepted");
                    updateToken(requestInput, userData.Item.userGuid.S, ddb, function(err, tokenData) {
                        console.log("Step(6)");
                        if (err) { console.log(err); respondError(origin, 500, err, callback); }
                        else {
                            console.log("Step(7)");
                            getHeroes(userData.Item.userGuid.S, function(err, heroesData) {
                                if (err) { console.log(err); respondError(origin, 500, err, callback); }
                                var responseData = { heroes: heroesData.Items };
                                console.log("Received this data from getHeroes():", JSON.stringify(heroesData));
                                responseData.maxTurns = MAX_TURNS;
                                responseData.accessToken = tokenData.accessToken;
                                responseData.userGuid = tokenData.userGuid;
                                respondOK(origin, responseData, callback);
                            });
                        }
                    });
                }
                else {
                    console.error("Wrong password, was [" + requestInput.password + "] exptected [" + userData.Item.password.S + "]");
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

function getHeroes(userGuid, callback) {
    var missingFields = new FV.FieldVerifier().Verify({userGuid:userGuid}, ["userGuid"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    console.log("Calling getHeroes via query...");
    
    // https://docs.amazonaws.cn/en_us/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.html
    // https://www.fernandomc.com/posts/eight-examples-of-fetching-data-from-dynamodb-with-node/
    ddb.query({
        TableName: HERO_TABLE_NAME,
        KeyConditionExpression: "userGuid = :userGuid",
        ExpressionAttributeValues: {
            ":userGuid": {S: userGuid}
        }
    },
    (err, heroData) => {
        if(err) { callback(err, null); return; }
        console.log("Got these data via query:");
        console.log(JSON.stringify(heroData));
        callback(null, heroData);
    })
}

function getHeroe2s(userGuid, callback) {
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    console.log("Getting data via query operation...");
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
        console.log("Got these data via statement:");
        console.log(JSON.stringify(heroData));
        callback(null, heroData);
    })

    /*ddb.scan({
        TableName: HERO_TABLE_NAME        
    },
    (err, heroData) => {
        if(err) { console.error("Scan failed."); callback(err, null); }
        console.log("Scan operation got hero data:");
        console.log(JSON.stringify(heroData));
        callback(null, { herores: heroData.Items });
    });*/
    
    /*ddb.query({
        TableName: HERO_TABLE_NAME
    },
    (err, data) => {
        console.log("got hero data");
        console.log(JSON.stringify(data));
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
       if (err) { console.error(err); throw err; }
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
