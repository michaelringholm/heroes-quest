var _logger = require('../common/Logger.js');
var _baseController = require('./BaseController.js');
var _battleCache = require('../battle/BattleCache.js');
var _heroDao = require('../hero/HeroDao.js');
var _mapFactory = require("../map/MapFactory.js");
var _loginDao = require('../login/LoginDao.js');
var Hero = require('../hero/Hero.js');

module.exports = 
function MapController() {
    var _this = this;

    this.Move = function(postData) {
        var gameSession = JSON.parse(postData);
        var serverLogin = _loginDao.Cache[gameSession.publicKey];

        if (serverLogin) {
            var direction = gameSession.direction;

            if (direction == "west" || direction == "east" || direction == "north" || direction == "south") {
                if (serverLogin.activeHero) {

                    if (_battleCache[serverLogin.activeHero.heroId]) {
                        var battle = _battleCache[serverLogin.activeHero.heroId];
                        return _baseController.JsonResult(200, battle);
                    }
                    else {
                        serverLogin.activeHero.currentCoordinates;
                        var location = new Hero(serverLogin.activeHero).move(direction, _battleCache);

                        if (location) {
                            _heroDao.save(serverLogin.activeHero);
                            var battle = _battleCache[serverLogin.activeHero.heroId];
                            if (battle)
                                return _baseController.JsonResult(200, battle);
                            else
                                return _baseController.JsonResult(200, location);
                        }
                        else {
                            return _baseController.JsonResult(500, { "reason": "Invalid location!"});
                        }
                    }
                }
                else {
                    return _baseController.JsonResult(500, { "reason": "No active hero found, please choose a hero!"});
                }
            }
            else {
                return _baseController.JsonResult(500, { "reason": "Invalid direction [' + direction + ']!"});
            }
        }
        else {
            return _baseController.JsonResult(500, { "reason": "Public key not found, please login again!"});
        }
    };

    this.EnterTown = function(postData) {
        _logger.logInfo(postData);
        var gameSession = null;
        var serverLogin = null;

        try {
            gameSession = JSON.parse(postData);
            serverLogin = _loginDao.Cache[gameSession.publicKey]
        }
        catch (ex) {
            _logger.logError(ex);
        }

        if (serverLogin) {
            if (serverLogin.activeHero) {
                var currentMap = _mapFactory.create(serverLogin.activeHero.currentMapKey);
                var location = currentMap.getLocation(serverLogin.activeHero.currentCoordinates);
                var data = null;

                if (location.town) {
                    data = { map: currentMap, hero: serverLogin.activeHero, town: location.town };
                }
                else {
                    data = { map: currentMap, hero: serverLogin.activeHero };
                }
                return _baseController.JsonResult(200, data);
            }
            else {
                _logger.logError("No hero selected!");
                return _baseController.JsonResult(500, { "error": "No hero selected!, please select one of your heroes, or create a new one!"});
            }
        }
        else {
            _logger.logError("Unable to find public key, please try to login again!");
            return _baseController.JsonResult(500, { "error": "Unable to find public key, please try to login again!"});
        }
    };
}