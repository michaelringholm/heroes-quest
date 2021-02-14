const AWS = require("aws-sdk");
var HQLIB = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Battle } = require("om-hq-lib");
var { BattleDAO } = require("om-hq-lib");
var { HttpController } = require("om-hq-lib");

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
    //var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});HttpController
    var requestInput = JSON.parse(event.body);
    if(!requestInput.accessToken) { Logger.logError("Access token missing!"); HttpController.respondError(origin, 500, "Access token missing!", callback); return; }    
    
    LoginDAO.getByToken(requestInput.accessToken, (err, loginDTO) => {
        if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed: enter town(1):" + err, callback); return; }
        HeroDAO.get(loginDTO.userGuid, loginDTO.activeHeroName, (err, heroDTO) => {
            if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed: enter town(2):" + err, callback); return; }
            if(heroDTO.isInBattle) { Logger.logError("Hero is in battle, can't enter town"); HttpController.respondError(origin, 500, "Hero is in battle, can't enter town", callback); return; }
            heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
            MapCache.getMap(hero.currentMapKey, (err, mapDTO) => {
                if(err) { Logger.logError(err); respondError(origin, 500, "Failed to load map:" + err, callback); return; }
                var map = new MidgaardMainMap();
                map.build(mapDTO);
                var data = { hero: hero, map: map };
                HttpController.respondOK(origin, data, callback);
            });
        });
    });
};

