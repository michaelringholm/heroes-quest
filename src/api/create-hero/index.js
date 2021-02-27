var AWS = require("aws-sdk");
var UUID = require('uuid');
var FV = require('./field-verifier.js');
var { HeroDTO } = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { HttpController } = require("om-hq-lib");

const ALLOWED_ORIGINS = ["http://localhost", "http://aws..."]

// Callback is (error, response)
exports.handler = function(event, context, callback) {
    Logger.logInfo(JSON.stringify(event));
    //AWS.config.update({region: 'eu-central-1'});
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
    
    HeroDAO.getAll(requestInput.userGuid, (err, heroDTOs) => {
        if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed to create hero(1):" + err, callback); return; }
            if(heroDTOs != null && heroDTOs.length > 2) { Logger.logError("You already have three heroes, delete one first."); HttpController.respondError(origin, 500, "You already have three heroes, delete one first.", callback); return; }
            //HeroDAO.get(requestInput.userGuid, requestInput.hero.heroName, (err, heroData) => {
                //if(err) { Logger.logError(err); respondError(origin, 500, "Failed to create hero(1):" + err, callback); }
                //else {
                    //Logger.logInfo("heroData=" + JSON.stringify(heroData));
        if(heroDTOs.length>0) {
            Logger.logInfo("Checking for existing hero name");
            for(var i=0;i<heroDTOs.length;i++) {
                if(requestInput.hero.heroName == heroDTOs[i].heroName) { Logger.logError("Hero name already exists"); HttpController.respondError(origin, 500, "Hero name already exists", callback); return; }
            }
        }
        HeroDAO.save(requestInput.userGuid, new HeroDTO(requestInput.hero), (err,newHeroData) => {
            if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed to create hero(2):" + err, callback); }
            else HttpController.respondOK(origin, newHeroData, callback);
        });
    });
};
