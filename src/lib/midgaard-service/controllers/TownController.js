var _logger = require('../common/Logger.js');
var _baseController = require('./BaseController.js');
var _mapFactory = require('../map/MapFactory.js');
var _loginDao = require('../login/LoginDao.js');
var _heroDao = require('../hero/HeroDao.js');
var Smithy = require('../town/Smithy.js');
var Hero = require('../hero/Hero.js');
var _smithy = new Smithy();

module.exports = 
function TownController() {
	var _this = this;

    this.Meadhall = function(postData) {
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

					if (location.town) {
						data = { map: currentMap, hero: serverLogin.activeHero, town: location.town };
						data.actionResponse = new Hero(serverLogin.activeHero).visitMeadhall();
						_heroDao.save(serverLogin.activeHero);
					}
					else {
						data = { map: currentMap, hero: serverLogin.activeHero, reason: "You have to be in a town to visit the meadhall" };
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

    this.Smithy = function(postData) {
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
					_logger.logInfo("wants to enter smithy!");
					if (location.town) {
						data = { map: currentMap, hero: serverLogin.activeHero, town: location.town };
						//data.smithy = {copper:500, items:[{name:"wooden sword",cost:1,atkMin:1,atkMax:3},{name:"long sword",cost:20,atkMin:2,atkMax:4},{name:"silver long sword",cost:1000,atkMin:3,atkMax:6}]};
						data.smithy = _smithy;
						_heroDao.save(serverLogin.activeHero);
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

    this.Character = function(postData) {
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
						data = { map: currentMap, hero: serverLogin.activeHero, reason: "You have to be in a town to view your character!" };
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

	this.Train = function(postData) {
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
					data.trainingOutcome = new Hero(serverLogin.activeHero).train();
					_heroDao.save(serverLogin.activeHero);
				}
				else {
					data = { map: currentMap, hero: serverLogin.activeHero, reason: "You have to be in a town to train!" };
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

	this.Leave = function(postData) {
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
				var data = { map: currentMap, hero: serverLogin.activeHero };
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