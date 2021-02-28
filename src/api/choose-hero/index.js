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
var { HttpController } = require("om-hq-lib");

const ALLOWED_ORIGINS = ["http://localhost", "http://aws..."]

// Callback is (error, response)
exports.handler = async function(event, context, callback) {
    Logger.logInfo(JSON.stringify(event));
    if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
    var method = event.requestContext.http.method;
    var origin = event.headers.origin;
    var referer = event.headers.referer;
    if(method == "OPTIONS") { HttpController.preFlightResponse(origin, referer, callback); return; }
    Logger.logInfo("method="+method);
    var requestInput = JSON.parse(event.body);
    if(!requestInput.accessToken) { Logger.logError("Access token missing!"); HttpController.respondError(origin, 500, "Access token missing!", callback); return; }
    
    var loginDTO = await LoginDAO.getByTokenAsync(requestInput.accessToken);
    var heroDTO = await HeroDAO.getAsync(loginDTO.userGuid, loginDTO.activeHeroName);
    heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
    var battleDTO = await BattleDAO.loadAsync(heroDTO.heroKey);
    Logger.logInfo("battleDTO="+JSON.stringify(battleDTO));
    var mapDTO = await MapCache.getMapAsync(heroDTO.currentMapKey);
    var map = new MidgaardMainMap(mapDTO);
    var location = map.getLocation(heroDTO.currentCoordinates);
    var updatedHero = await LoginDAO.setActiveHeroNameAsync(loginDTO.userName, heroDTO.heroName);
    var data = {hero:heroDTO,battle:battleDTO, map:map,location:location};
    HttpController.respondOK(origin, data, callback);
};