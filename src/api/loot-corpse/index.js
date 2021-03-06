const AWS = require("aws-sdk");
var HQLIB = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Battle } = require("om-hq-lib");
var { BattleDAO } = require("om-hq-lib");
var { HttpController } = require("om-hq-lib");
var { MidgaardMainMap } = require("om-hq-lib");
var { MapCache } = require("om-hq-lib");

// Callback is (error, response)
exports.handler = async function(event, context, callback) {
    Logger.logInfo(JSON.stringify(event));
    if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
    var method = event.requestContext.http.method;
    var origin = event.headers.origin;
    var referer = event.headers.referer;
    Logger.logInfo("method="+method);
    if(method == "OPTIONS") { HttpController.preFlightResponse(origin, referer, callback); return; }
    var requestInput = JSON.parse(event.body);
    try {
        if(!requestInput.accessToken) throw new Error("Access token missing!");
        var loginDTO = await LoginDAO.getByTokenAsync(requestInput.accessToken);
        var heroDTO = await HeroDAO.getAsync(loginDTO.userGuid, loginDTO.activeHeroName);
        heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
        var battleDTO = await BattleDAO.loadAsync(heroDTO.heroKey);        
        var battle = new Battle(battleDTO);
        await battle.lootCorpseAsync(loginDTO.userGuid, heroDTO.heroKey);
        var mapDTO = await MapCache.getMapAsync(heroDTO.currentMapKey);
        var map = new MidgaardMainMap(mapDTO);
        var location = map.getLocation(heroDTO.currentCoordinates);
        HttpController.respondOK(origin, {hero:battleDTO.hero,battle:battleDTO,map:map,location:location}, callback);
    }
    catch(ex) { Logger.logError(ex.stack); HttpController.respondError(origin, 500, ex.toString(), callback); return }    
};

