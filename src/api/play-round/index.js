const AWS = require("aws-sdk");
const UUID = require('uuid');
var HQLIB = require("om-hq-lib");
var { HeroDAO } = require("om-hq-lib");
var { Logger } = require("om-hq-lib");
var { LoginDAO } = require("om-hq-lib");
var { Battle } = require("om-hq-lib");
var { BattleDAO } = require("om-hq-lib");
var { HttpController } = require("om-hq-lib");

const maxTurns = 50;
const deckSize = 12;
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
    //var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});HttpController
    var requestInput = JSON.parse(event.body);
    if(!requestInput.accessToken) { Logger.logError("Access token missing!"); HttpController.respondError(origin, 500, "Access token missing!", callback); return; }
    if(!requestInput.battleAction) { Logger.logError("Battle action missing!"); HttpController.respondError(origin, 500, "Battle action missing!", callback); return; }
    
    LoginDAO.getByToken(requestInput.accessToken, (err, loginDTO) => {
        if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed: map move(1):" + err, callback); return; }
        HeroDAO.get(loginDTO.userGuid, loginDTO.activeHeroName, (err, heroDTO) => {
            if(err) { Logger.logError(err); HttpController.respondError(origin, 500, "Failed: map move(2):" + err, callback); return; }
            heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
            BattleDAO.load(heroDTO.heroKey, (err, battleDTO) => {
                if(err) { Logger.logError(err, err.stack); HttpController.respondError(origin, 500, "failed to get battle:" + err, callback); return; }                
                new Battle(battleDTO).nextRound(requestInput.battleAction, (err, heroDTO) => {
                    HttpController.respondOK(origin, {hero:heroDTO, battle:battleDTO}, callback);
                    return;
                });                
            });
        });
    });
};

function insertHighScore(userInfo, round, callback) {
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    console.log("Inside insertHighScore()");
    console.log("totalScore=" + round.totalScore);
    console.log(JSON.stringify(round));
    var scoreGuid = UUID.v4();
    var params = {
        TableName: 'xmas-fun-high-score',
        Item: {
          'scoreGuid': {S: scoreGuid},
          'userGuid': {S: userInfo.userGuid},
          'score': {N: round.totalScore.toString()},
          'userName': {S: userInfo.userName}
        },
        ReturnConsumedCapacity: "TOTAL", 
        //ProjectionExpression: 'ATTRIBUTE_NAME'
    };    
    ddb.putItem(params, function(err, userData) {
        if (err) { console.log(err); callback(err); }
        else callback(null);
    }); 
};

function playRound(userInfo, callback) {
    var round = {};
    getUserScore(userInfo.userGuid, function(oldScore, turnsUsed) {
        if(turnsUsed < maxTurns) {
            round.turnsUsed = turnsUsed;
            round.card1 = getRandomInt(deckSize);
            round.card2 = getRandomInt(deckSize);
            round.card3 = getRandomInt(deckSize);
            round.score = Math.round(calculateRoundScore(round, oldScore));
            round.totalScore = oldScore + round.score;
        }
        round.maxTurns = maxTurns;
        callback(round);
    });    
}

function calculateRoundScore(round, oldScore) {
    var line = round.card1 + "#" + round.card2 + "#" + round.card3;        
    if(round.card1 == cardsEnum.DEER && round.card2 == cardsEnum.DEER && round.card3 == cardsEnum.DEER) return 1500;
    if(round.card1 == cardsEnum.DEER && round.card2 == cardsEnum.DEER) return 300;
    if(round.card1 == cardsEnum.DEER) return 70;
    if(round.card1 == cardsEnum.SANTA && round.card2 == cardsEnum.SANTA && round.card3 == cardsEnum.SANTA) return 500;
    //if(round.card1 == cardsEnum.SANTA && round.card2 == cardsEnum.SANTA) return 300;
    //if(round.card1 == cardsEnum.SANTA) return 100;
    if(round.card1 == cardsEnum.CANDY_CANE && round.card2 == cardsEnum.CANDY_CANE && round.card3 == cardsEnum.CANDY_CANE) return 150;
    if(round.card1 == cardsEnum.CANDY_CANE && round.card2 == cardsEnum.CANDY_CANE) return 90;
    if(round.card1 == cardsEnum.CANDY_CANE) return 30;
    if(round.card1 == cardsEnum.GIFT && round.card2 == cardsEnum.GIFT && round.card3 == cardsEnum.GIFT) { --round.turnsUsed; return 300};
    if(round.card1 == cardsEnum.GIFT && round.card2 == cardsEnum.GIFT) { --round.turnsUsed; return 180; }
    if(round.card1 == cardsEnum.GIFT) { --round.turnsUsed; return 60; }
    if(round.card1 == cardsEnum.GRINCH && round.card2 == cardsEnum.GRINCH && round.card3 == cardsEnum.GRINCH) return -180;
    if(round.card1 == cardsEnum.GRINCH && round.card2 == cardsEnum.GRINCH) return -120;
    if(round.card1 == cardsEnum.GRINCH) return -60;
    if(round.card1 == cardsEnum.BONBON && round.card2 == cardsEnum.BONBON && round.card3 == cardsEnum.BONBON) return 100;
    //if(round.card1 == cardsEnum.BONBON && round.card2 == cardsEnum.BONBON) return 60;
    //if(round.card1 == cardsEnum.BONBON) return 20;
    if(round.card1 == cardsEnum.LOLLIPOP && round.card2 == cardsEnum.LOLLIPOP && round.card3 == cardsEnum.LOLLIPOP) return 125;
    if(round.card1 == cardsEnum.LOLLIPOP && round.card2 == cardsEnum.LOLLIPOP) return 75;
    if(round.card1 == cardsEnum.LOLLIPOP) return 25;
    if(round.card1 == cardsEnum.ANGEL && round.card2 == cardsEnum.ANGEL && round.card3 == cardsEnum.ANGEL) return oldScore*0.3;
    if(round.card1 == cardsEnum.ANGEL && round.card2 == cardsEnum.ANGEL) return oldScore*0.2;
    if(round.card1 == cardsEnum.ANGEL) return oldScore*0.1;
    if(round.card1 == cardsEnum.GINGERBREAD_MAN && round.card2 == cardsEnum.GINGERBREAD_MAN && round.card3 == cardsEnum.GINGERBREAD_MAN) return 200;
    //if(round.card1 == cardsEnum.GINGERBREAD_MAN && round.card2 == cardsEnum.GINGERBREAD_MAN) return 120;
    //if(round.card1 == cardsEnum.GINGERBREAD_MAN) return 40;
    if(round.card1 == cardsEnum.XMAS_HAT && round.card2 == cardsEnum.XMAS_HAT && round.card3 == cardsEnum.XMAS_HAT) return 250;
    //if(round.card1 == cardsEnum.XMAS_HAT && round.card2 == cardsEnum.XMAS_HAT) return 150;
    //if(round.card1 == cardsEnum.XMAS_HAT) return 50;
    if(round.card1 == cardsEnum.NUT_CRACKER && round.card2 == cardsEnum.NUT_CRACKER && round.card3 == cardsEnum.NUT_CRACKER) return oldScore*-0.3;
    if(round.card1 == cardsEnum.NUT_CRACKER && round.card2 == cardsEnum.NUT_CRACKER) return oldScore*-0.2;
    if(round.card1 == cardsEnum.NUT_CRACKER) return oldScore*-0.1;
    if(round.card1 == cardsEnum.XMAS_TREE && round.card2 == cardsEnum.XMAS_TREE && round.card3 == cardsEnum.XMAS_TREE) return 360;
    if(round.card1 == cardsEnum.XMAS_TREE && round.card2 == cardsEnum.XMAS_TREE) return 215;
    //if(round.card1 == cardsEnum.XMAS_TREE) return 75;    
    return 0;
}

const cardsEnum = {
    DEER: 0,
    SANTA: 1,
    CANDY_CANE: 2,
    GIFT: 3,
    GRINCH: 4,
    BONBON: 5,
    LOLLIPOP: 6,
    ANGEL: 7,
    GINGERBREAD_MAN: 8,
    XMAS_HAT: 9,
    NUT_CRACKER: 10,
    XMAS_TREE: 11
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getUserScore(userGuid, callback) {
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    
    var params = {
      TableName: 'xmas-fun-score',
      Key: {
        'userGuid': {S: userGuid}
      },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };
    
    ddb.getItem(params, function(err, userData) {
       if (err) { console.error(err); throw err; }
       else {
            if(userData == null || userData.Item == null || userData.Item.score == null)
                callback(0,0); // First round no data yet
            else
                callback(parseInt(userData.Item.score.N), parseInt(userData.Item.turnsUsed.N));
       }
    });
}



