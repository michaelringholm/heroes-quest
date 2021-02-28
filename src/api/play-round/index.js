const AWS = require("aws-sdk");
var HQLIB = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Battle } = require("om-hq-lib");
var { BattleDAO } = require("om-hq-lib");
var { HttpController } = require("om-hq-lib");

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
        if(!requestInput.battleAction) throw new Error("Battle action missing!");
        var loginDTO = await LoginDAO.getByTokenAsync(requestInput.accessToken);
        var heroDTO = await HeroDAO.getAsync(loginDTO.userGuid, loginDTO.activeHeroName);
        heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
        var battleDTO = await BattleDAO.loadAsync(heroDTO.heroKey);        
        battleDTO = await new Battle(battleDTO, heroDTO).nextRoundAsync(loginDTO.userGuid, heroDTO.heroKey, requestInput.battleAction);
        Logger.logInfo("***battleDTO="+JSON.stringify(battleDTO));
        HttpController.respondOK(origin, {hero:heroDTO, battle:battleDTO}, callback);
    }
    catch(ex) { Logger.logError(ex.stack); HttpController.respondError(origin, 500, ex.toString(), callback); return }    
};

