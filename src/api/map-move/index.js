const AWS = require("aws-sdk");
const UUID = require('uuid');
const FV = require('./field-verifier.js');
var { MidgaardMainMap } = require("om-hq-lib");
var { MobFactory } = require("om-hq-lib");
var { MapCache } = require("om-hq-lib");
var { BattleCache } = require("om-hq-lib");
var { Hero } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");

const MAX_TURNS = 50;
const LOGIN_TABLE_NAME = "om-hq-login";
const HERO_TABLE_NAME = "om-hq-hero"
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
    
    LoginDAO.get(requestInput.userName, (err, loginDTO) => {
        if(err) { Logger.logError(err); respondError(origin, 500, "Failed: map move(1):" + err, callback); return; }
        //requestInput.activeHeroName = requestInput;
        HeroDAO.get(loginDTO.userGuid, loginDTO.activeHeroName, (err, heroDTO) => {
            if(err) { Logger.logError(err); respondError(origin, 500, "Failed: map move(2):" + err, callback); return; }
            heroDTO.heroKey = heroDTO.userGuid+"#"+heroDTO.heroName;
            if(heroDTO != null && heroDTO.currentMapKey == null) heroDTO.currentMapKey = "midgaard-main";
            if(heroDTO != null && heroDTO.currentCoordinates == null) heroDTO.currentCoordinates = {x:0,y:0};

            MapCache.getMap(heroDTO.currentMapKey, (err, mapDTO) => {
                if(err) { Logger.logError(err); respondError(origin, 500, "Failed to load map:" + err, callback); return; }
                var map = new MidgaardMainMap();
                map.build(mapDTO);
                //var location = map.getLocation(hero.currentCoordinates);
                //var data = { hero: hero, battle: battleDTO, map: map, status: 'Your active hero is now [' + hero.heroKey + ']!' };
                //MapDictionary.addMap(map);
                //var currentMap = MapDictionary.getMap(heroDTO.currentMapKey);
                //var location = currentMap.getLocation(heroDTO.currentCoordinates);
                //var data = { heroDTO: heroDTO, battle: currentBattle, map: currentMap, status: 'Your active heroDTO is now [' + heroDTO.heroKey + ']!' };
                var direction = requestInput.direction;
                if (direction == "west" || direction == "east" || direction == "north" || direction == "south") {
                    if (heroDTO.inBattle) {
                        getBattle(heroDTO.heroKey, (err, battleDTO) => {
                            if(err) { Logger.logError(err, err.stack); respondError(origin, 500, "failed to get battle:" + err, callback); return; }
                            respondOK(origin, battleDTO, callback);
                            return;
                        });
                    }
                    else {
                        heroDTO.currentCoordinates;
                        Logger.logInfo("coords are:", heroDTO.currentCoordinates);
                        new Hero(heroDTO).move(requestInput, heroDTO, direction, map, (err, moveResult) => {
                            if(err) { Logger.logError(err); respondError(origin, 500, "Failed to move" + err, callback); return; }
                            if (moveResult.newLocation) {
                                //_heroDao.save(serverLogin.activeHero);
                                //var battle = _battleCache[serverLogin.activeHero.heroId];
                                if (moveResult.battle) {
                                    updateBattle(requestInput, heroDTO, (err, updatedHero) => {
                                        if(err) { Logger.logError(err); respondError(origin, 500, "Failed to update battle:" + err, callback); return; }
                                        respondOK(origin, moveResult, callback);
                                        return;
                                    });
                                }
                                else {
                                    HeroDAO.save(requestInput.userGuid, heroDTO, (err, updatedHero) => {
                                        if(err) { Logger.logError(err); respondError(origin, 500, "Failed to update location:" + err, callback); return; }
                                        respondOK(origin, moveResult, callback);
                                        return;
                                    });
                                }
                            }
                            else { Logger.logError(err); respondError(origin, 500, "Invalid location!", callback); return; }   
                        });                           
                    }
                }
                else { Logger.logError("Invalid direction [" + direction + "]!"); respondError(origin, 500, "Invalid direction [" + direction + "]!", callback); return; }            
            });
        });
    });
};

function getActiveHeroName(requestInput, callback) {
    Logger.logInfo("getActiveHeroName...");
    var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userName"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    Logger.logInfo("Calling getActiveHeroName via statement...");
    
    ddb.query({
        TableName: LOGIN_TABLE_NAME,
        KeyConditionExpression: "userName = :userName",
        ExpressionAttributeValues: {
            ":userName": {S: requestInput.userName}
        }
    },
    (err, loginItems) => {
        if(err) { callback(err, null); return; }
        Logger.logInfo("Got these data via statement:");
        Logger.logInfo(JSON.stringify(loginItems));
        var loginDTO = AWS.DynamoDB.Converter.unmarshall(loginItems.Items[0]); // Seems only new fields are in Dynamo format
        callback(null, loginDTO);
    })
}

/*
function getHero(loginDTO, callback) {
    var missingFields = new FV.FieldVerifier().Verify(loginDTO, ["userGuid","activeHeroName"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    Logger.logInfo("Calling getHero via statement...");
    
    ddb.query({
        TableName: HERO_TABLE_NAME,
        KeyConditionExpression: "userGuid = :userGuid and heroName = :heroName", // "userGuid = :userGuid and heroName = :heroName",
        ExpressionAttributeValues: {
            ":userGuid": {S: loginDTO.userGuid},
            ":heroName": {S: loginDTO.activeHeroName},            
        }
    },
    (err, heroData) => {
        if(err) { callback(err, null); return; }
        Logger.logInfo("Got these data via statement:");
        Logger.logInfo(JSON.stringify(heroData));
        var heroDTO = AWS.DynamoDB.Converter.unmarshall(heroData.Items[0]); // Seems only new fields are in Dynamo format
        callback(null, heroDTO);
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
