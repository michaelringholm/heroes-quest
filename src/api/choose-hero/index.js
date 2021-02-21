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
exports.handler = function(event, context, callback) {
    Logger.logInfo(JSON.stringify(event));
    if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
    var method = event.requestContext.http.method;
    var origin = event.headers.origin;
    var referer = event.headers.referer;
    if(method == "OPTIONS") {
        HttpController.preFlightResponse(origin, referer, callback);
        return;
    }
    Logger.logInfo("method="+method);

    //var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var requestInput = JSON.parse(event.body);
    if(!requestInput.accessToken) { Logger.logError("Access token missing!"); HttpController.respondError(origin, 500, "Access token missing!", callback); return; }
    
    LoginDAO.getByToken(requestInput.accessToken, (err, loginDTO) => {
        if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed: choose hero(1):" + err, callback); return; }
        HeroDAO.get(loginDTO.userGuid, loginDTO.activeHeroName, (err, heroDTO) => {
            if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed: choose hero(2):" + err, callback); return; }
            heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
            //if(hero != null && hero.currentMapKey == null || hero.currentMapKey == "" ) hero.currentMapKey = "midgaard-main";
            //if(hero != null && hero.currentCoordinates == null) hero.currentCoordinates = {x:0,y:0};
            if(heroDTO.isInBattle) {
                BattleDAO.load(heroDTO.heroKey, (err, battleDTO) => {
                    if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed to load battle:" + err, callback); return; }
                    Logger.logInfo("battleDTO="+JSON.stringify(battleDTO));
                    loadMap(callback, origin, loginDTO.userName, heroDTO, battleDTO);
                });
            }
            else
                loadMap(callback, origin, loginDTO.userName, heroDTO);
        });
    });
};

function loadMap(callback, origin, userName, hero, battleDTO) {
    Logger.logInfo("currentMapKey=" + hero.currentMapKey);
    MapCache.getMap(hero.currentMapKey, (err, mapDTO) => {
        if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed to load map:" + err, callback); return; }
        var map = new MidgaardMainMap();
        map.build(mapDTO);
        var location = map.getLocation(hero.currentCoordinates);
        var data = { hero: hero, battle: battleDTO, map: map, status: 'Your active hero is now [' + hero.heroKey + ']!' };
        
        Logger.logInfo("Found the following records while checking for existing hero:");
        Logger.logInfo(JSON.stringify(hero));
        LoginDAO.setActiveHeroName(userName, hero.heroName, (err, updatedHero) => {
            if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed to set active hero:" + err, callback); return; }
            else HttpController.respondOK(origin, data, callback);
        });                   
    });
}