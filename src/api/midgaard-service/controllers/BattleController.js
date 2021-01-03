var _logger = require('../common/Logger.js');
var _baseController = require('./BaseController.js');
var _battleDao = require('../battle/BattleDao.js');
var _heroDao = require('../hero/HeroDao.js');
var _mapFactory = require('../map/MapFactory.js');
var _loginDao = require('../login/LoginDao.js');
var Battle = require('../battle/Battle.js');
var _battleCache = require('../battle/BattleCache.js');

module.exports = 
function BattleController() {
    var _this = this;    

    this.NextRound = function(postData) {
        var gameSession = JSON.parse(postData);
        var serverLogin = _loginDao.Cache[gameSession.publicKey];

        if (serverLogin) {           
            if (serverLogin.activeHero) {
                var battleDTO = _battleCache[serverLogin.activeHero.heroId];
                var battle = new Battle(battleDTO);
                if (battle && battleDTO && !battleDTO.status.over) {
                    battleDTO.hero.currentBattleAction = gameSession.ability;
                    battleDTO.mob.currentBattleAction = "melee";
                    battle.nextRound();
                    _heroDao.save(serverLogin.activeHero);
                    _battleDao.save(_battleCache);

                    if (battleDTO.status.over) {
                        delete _battleCache[serverLogin.activeHero.heroId];
                        var data = { hero: serverLogin.activeHero, battle: battleDTO };
                        return _baseController.JsonResult(200, data);
                    }
                    else {
                        var data = { hero: serverLogin.activeHero, battle: battleDTO };
                        return _baseController.JsonResult(200, (data));
                    }
                }
                else {                        
                    if(battle && battleDTO && battleDTO.status.over) { // Should not happen unless out of sync
                        delete _battleCache[serverLogin.activeHero.heroId];
                        _battleDao.save(_battleCache);
                    }
                    var currentMap = _mapFactory.create(serverLogin.activeHero.currentMapKey);
                    var data = { map: currentMap, hero: serverLogin.activeHero, status: "Battle not found!" };
                    return _baseController.JsonResult(200, data);
                }
            }
            else {
                return _baseController.JsonResult(500,{ "reason": "No active hero found, please choose a hero!"});
            }            
        }
        else {
            return _baseController.JsonResult(500,{ "reason": "Public key not found, please login again!"});
        }
    };

    this.Flee = function() {
        var gameSession = JSON.parse(postData);
        var serverLogin = _loginDao.Cache[gameSession.publicKey];

        if (serverLogin) {

            if (serverLogin.activeHero) {
                var battle = _battleCache[serverLogin.activeHero.heroId];

                if (battle) {
                    battle.flee();                    
                    _heroDao.save(serverLogin.activeHero);
                    _battleDao.save(_battleCache);
                    if (battle.status.over)
                        delete _battleCache[serverLogin.activeHero.heroId];

                    var data = { hero: serverLogin.activeHero, battle: battle };
                }
                else {
                    var currentMap = _mapFactory.create(serverLogin.activeHero.currentMapKey);
                    var data = { map: currentMap, hero: serverLogin.activeHero, status: "Battle not found!" };                    
                }
                return _baseController.JsonResult(200, data);
            }
            else {
                return _baseController.JsonResult(500, { "reason": "No active hero found, please choose a hero!"});
            }
        }
        else {
            return _baseController.JsonResult(500, { "reason": "Public key not found, please login again!"});
        }
    };

    this.construct = function() {
        _logger.logInfo("BattleDao.construct");
  	};
  
  _this.construct();
}