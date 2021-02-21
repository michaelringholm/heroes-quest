const AWS = require("aws-sdk");
var HQLIB = require("om-hq-lib");
var { Hero } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
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
        if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed(1):" + err, callback); return; }
        HeroDAO.get(loginDTO.userGuid, loginDTO.activeHeroName, (err, heroDTO) => {
            if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed(2):" + err, callback); return; }
            heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
            new Hero(heroDTO).visitMeadhall(loginDTO.userGuid, heroDTO.heroKey, (err, heroDTO) => {
                if(err) { Logger.logError(err, err.stack); HttpController.respondError(origin, 500, "Failed to visit meadhall:" + err, callback); return; }                
                HttpController.respondOK(origin, {hero:heroDTO}, callback);
                return;
            });
        });
    });
};

