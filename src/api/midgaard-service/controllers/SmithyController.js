var _logger = require('../common/Logger.js');
var _baseController = require('./BaseController.js');
var _heroDao = require('../hero/HeroDao.js');
var _mapFactory = require('../map/MapFactory.js');
var _loginDao = require('../login/LoginDao.js');

module.exports =
function SmithyController() {
    var _this = this;

    this.BuyItem = function (postData) {
        _logger.logInfo("SmithyController.BuyItem called!");
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
                _logger.logInfo("wants to buy an item!");
                var data = null;
                var currentMap = _mapFactory.create(serverLogin.activeHero.currentMapKey);
                var location = currentMap.getLocation(serverLogin.activeHero.currentCoordinates);
                eval["SmithyController"]["BuyItem"](gameSession);

                if (location.town) {
                    if (gameSession.itemKey) {
                        var buyResponse = _smithy.buyItem(gameSession.itemKey, serverLogin.activeHero);
                        data = { map: currentMap, hero: serverLogin.activeHero, town: location.town };
                        data.smithy = _smithy;
                        data.buyResponse = buyResponse;
                        _heroDao.save(serverLogin.activeHero);
                    }
                    else {
                        _logger.logError("No item selected!");
                        return _baseController.JsonResult(500, { "error": "No item selected!, please select an item to buy!"});
                    }
                }
                else {
                    data = { map: currentMap, hero: serverLogin.activeHero, reason: "You have to be in a town to visit the smithy!" };
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

    this.SellItem = function(postData) {
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
                _logger.logInfo("wants to sell an item!");

                if (location.town) {
                    if (gameSession.itemKey) {
                        var sellResponse = _smithy.sellItem(gameSession.itemKey, serverLogin.activeHero);
                        data = { map: currentMap, hero: serverLogin.activeHero, town: location.town };
                        data.smithy = _smithy;
                        data.sellResponse = sellResponse;
                        _heroDao.save(serverLogin.activeHero);
                    }
                    else {
                        _logger.logError("No hero selected!");
                        return _baseController.JsonResult(500, { "error": "No hero selected!, please select one of your heroes, or create a new one!"});
                    }
                }
                else {
                    data = { map: currentMap, hero: serverLogin.activeHero, reason: "You have to be in a town to visit the smithy!" };
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