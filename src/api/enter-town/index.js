const AWS = require("aws-sdk");
var HQLIB = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Hero } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Battle } = require("om-hq-lib");
var { BattleDAO } = require("om-hq-lib");
var { MapCache } = require("om-hq-lib");
var { MidgaardMainMap } = require("om-hq-lib");
var { HttpController } = require("om-hq-lib");

// Callback is (error, response)
exports.handler = async function(event, context, callback) {
    Logger.logInfo(JSON.stringify(event));
    if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
    var method = event.requestContext.http.method;
    var origin = event.headers.origin;
    var referer = event.headers.referer;
    if(method == "OPTIONS") { HttpController.preFlightResponse(origin, referer, callback); return; }
    Logger.logInfo("method="+method);
    try {
        var requestInput = JSON.parse(event.body);
        if(!requestInput.accessToken) { Logger.logError("Access token missing!"); HttpController.respondError(origin, 500, "Access token missing!", callback); return; }    
        var loginDTO = await LoginDAO.getByTokenAsync(requestInput.accessToken);
        var heroDTO = await HeroDAO.getAsync(loginDTO.userGuid, loginDTO.activeHeroName);
        var hero = new Hero(heroDTO);
        var data = await hero.enterTownAsync(loginDTO, heroDTO);
    }
    catch(ex) { HttpController.respondError(origin, 500, "Failed to enter town:"+ex, callback); return; }
    HttpController.respondOK(origin, data, callback);
};

