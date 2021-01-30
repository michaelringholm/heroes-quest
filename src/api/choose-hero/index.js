const AWS = require("aws-sdk");
const UUID = require('uuid');
const FV = require('./field-verifier.js');
var { MidgaardMainMap } = require("om-hq-lib");
var { MobFactory } = require("om-hq-lib");
var { MapCache } = require("om-hq-lib");
var { BattleCache } = require("om-hq-lib");
var { BattleDAO } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");

const MAX_TURNS = 50;
const ALLOWED_ORIGINS = ["http://localhost", "http://aws..."]

// Callback is (error, response)
exports.handler = function(event, context, callback) {
    Logger.logInfo(JSON.stringify(event));
    if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
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
    
    HeroDAO.get(requestInput.userGuid, requestInput.hero.heroName, (err, hero) => {
        if(err) { console.error(err); respondError(origin, 500, "Failed: choose hero(1):" + err, callback); return; }
        hero.heroKey = hero.userGuid+"#"+hero.heroName;
        if(hero != null && hero.currentMapKey == null || hero.currentMapKey == "" ) hero.currentMapKey = "midgaard-main";
        if(hero != null && hero.currentCoordinates == null) hero.currentCoordinates = {x:0,y:0};
        if(hero.isInBattle) {
            BattleDAO.load(origin, hero.heroKey, (err, battleDTO) => {
                if(err) { console.error(err); respondError(origin, 500, "Failed to load battle:" + err, callback); }
                Logger.logInfo("battleDTO="+JSON.stringify(battleDTO));
                loadMap(callback, requestInput.userName, hero, battleDTO);
            });
        }
        else
            loadMap(callback, origin, requestInput.userName, hero);
    });
};

function loadMap(callback, origin, userName, hero, battleDTO) {
    MapCache.getMap(hero.currentMapKey, (err, mapDTO) => {
        if(err) { console.error(err); respondError(origin, 500, "Failed to load map:" + err, callback); }
        var map = new MidgaardMainMap();
        map.build(mapDTO);
        var location = map.getLocation(hero.currentCoordinates);
        var data = { hero: hero, battle: battleDTO, map: map, status: 'Your active hero is now [' + hero.heroKey + ']!' };
        
        Logger.logInfo("Found the following records while checking for existing hero:");
        Logger.logInfo(JSON.stringify(hero));
        LoginDAO.setActiveHeroName(userName, hero.heroName, (err, updatedHero) => {
            if(err) { console.error(err); respondError(origin, 500, "Failed to set active hero:" + err, callback); }
            else respondOK(origin, data, callback);
        });                   
    });
}

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
        if (err) { Logger.logInfo(err); callback(err, null); }
        else {       
            Logger.logInfo("Hero created");
            callback(null, newHeroData);
        }
    });    
}

function getHeroes(requestInput, callback) {
    var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    Logger.logInfo("Calling getHeroes via query...");
    
    ddb.query({
        TableName: HERO_TABLE_NAME,
        KeyConditionExpression: "userGuid = :userGuid", // "userGuid = :userGuid and heroName = :heroName",
        ExpressionAttributeValues: {
            ":userGuid": {S: requestInput.userGuid}
        }
    },
    (err, heroData) => {
        if(err) { callback(err, null); return; }
        Logger.logInfo("Got these data via query:");
        Logger.logInfo(JSON.stringify(heroData));
        callback(null, heroData);
    })
}

/*function getHero(requestInput, callback) {
    var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid","hero.heroName"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    Logger.logInfo("Calling getHero via statement...");
    
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
        var hero = AWS.DynamoDB.Converter.unmarshall(heroData.Items[0]); // Seems only new fields are in Dynamo format
        callback(null, hero);
    })
}*/

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
        body: JSON.stringify({ response: 'Hero chosen', data: data }),
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
