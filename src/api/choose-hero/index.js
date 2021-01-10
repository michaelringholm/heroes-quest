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

    //var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var requestInput = JSON.parse(event.body);    
    
    getHero(requestInput, (err, heroData) => {
        if(err) { console.error(err); respondError(origin, 500, "Failed: choose hero(1):" + err, callback); return; }

        var currentBattle = _battleCache[serverLogin.activeHero.heroId]; //TODO
        var currentMap = _mapFactory.create(serverLogin.activeHero.currentMapKey);
        var location = currentMap.getLocation(serverLogin.activeHero.currentCoordinates);
        var data = { hero: loadedHero, battle: currentBattle, map: currentMap, status: 'Your active hero is now [' + loadedHero.heroId + ']!' };
        
        console.log("Found the following records while checking for existing hero:");
        console.log(JSON.stringify(heroData));
        if(heroData != null && heroData.Count > 0) { console.error("Hero name already exists"); respondError(origin, 500, "Hero name already exists", callback); return; }                    
        else {
            createHero(requestInput, (err,newHeroData) => {
                if(err) { console.error(err); respondError(origin, 500, "Failed to create hero(2):" + err, callback); }
                else respondOK(origin, newHeroData, callback);
            });
        }
    });
};

function createMap(requestInput, callback) {
    var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid","hero.heroName","hero.heroClass"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return; }
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: HERO_TABLE_NAME,
        Item: {
          'userGuid': {S: requestInput.userGuid},
          'heroName': {S: requestInput.hero.heroName},
          'heroClass': {S: requestInput.hero.heroClass}
        },
        ReturnConsumedCapacity: "TOTAL", 
        //ProjectionExpression: 'ATTRIBUTE_NAME'
    };    
    ddb.putItem(params, function(err, newHeroData) {
        if (err) { console.log(err); callback(err, null); }
        else {       
            console.log("Hero created");
            callback(null, newHeroData);
        }
    });    
}

function getHeroes(requestInput, callback) {
    var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    console.log("Calling getHeroes via query...");
    
    ddb.query({
        TableName: HERO_TABLE_NAME,
        KeyConditionExpression: "userGuid = :userGuid", // "userGuid = :userGuid and heroName = :heroName",
        ExpressionAttributeValues: {
            ":userGuid": {S: requestInput.userGuid}
        }
    },
    (err, heroData) => {
        if(err) { callback(err, null); return; }
        console.log("Got these data via query:");
        console.log(JSON.stringify(heroData));
        callback(null, heroData);
    })
}

function getHero(requestInput, callback) {
    var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid","hero.heroName"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    console.log("Calling getHero via statement...");
    
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
