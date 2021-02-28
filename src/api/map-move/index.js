const AWS = require("aws-sdk");
const UUID = require('uuid');
const FV = require('./field-verifier.js');
var { MidgaardMainMap } = require("om-hq-lib");
var { MobFactory } = require("om-hq-lib");
var { MapCache } = require("om-hq-lib");
var { BattleCache } = require("om-hq-lib");
var { BattleDAO } = require("om-hq-lib");
var { Hero } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { HttpController } = require("om-hq-lib");

const MAX_TURNS = 50;
const LOGIN_TABLE_NAME = "om-hq-login";
const HERO_TABLE_NAME = "om-hq-hero"
const ALLOWED_ORIGINS = ["http://localhost", "http://aws..."]

// Callback is (error, response)
exports.handler = async function(event, context, callback) {
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
    if(!requestInput.accessToken) { Logger.logError("Access token missing!"); HttpController.respondError(origin, 500, "Access token missing!", callback); return; }
    
    var loginDTO = await LoginDAO.getByTokenAsync(requestInput.accessToken);
    var heroDTO = await HeroDAO.getAsync(loginDTO.userGuid, loginDTO.activeHeroName);
    heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
    if(heroDTO != null && heroDTO.currentMapKey == null) heroDTO.currentMapKey = "midgaard-main";
    if(heroDTO != null && heroDTO.currentCoordinates == null) heroDTO.currentCoordinates = {x:0,y:0};
    var mapDTO = await MapCache.getMapAsync(heroDTO.currentMapKey);
    Logger.logInfo("mapDTO="+JSON.stringify(mapDTO));
    var map = new MidgaardMainMap();
    map.build(mapDTO);
    var direction = requestInput.direction;
    if (direction == "west" || direction == "east" || direction == "north" || direction == "south") {
        if (heroDTO.isInBattle) {
            Logger.logInfo("Hero is in a battle, not moving!");
            var battleDTO = await BattleDAO.loadAsync(heroDTO.heroKey);
            HttpController.respondOK(origin, {hero:heroDTO, battle:battleDTO}, callback);
            return;
        }
        else {
            heroDTO.currentCoordinates;
            Logger.logInfo("coords are:", heroDTO.currentCoordinates);
            var moveResult = await new Hero(heroDTO).moveAsync(loginDTO.userGuid, heroDTO, direction, map);
            Logger.logInfo("Move result:" + JSON.stringify(moveResult));
            if (moveResult && moveResult.newLocation) {
                HttpController.respondOK(origin, moveResult, callback); return;
            }
            else { Logger.logError(err); HttpController.respondError(origin, 500, "Invalid location!", callback); return; }   
        }
    }
    else { Logger.logError("Invalid direction [" + direction + "]!"); HttpController.respondError(origin, 500, "Invalid direction [" + direction + "]!", callback); return; }            
};
