var http = require('http');
var fs = require('fs');

// IMPORTS
var _logger = require('./common/Logger.js');
var AppContext = require('./context/AppContext.js');
var Router = require('./common/Router.js');
var _router = new Router();

var Login = require('./login/Login.js');

var HeroDao = require('./hero/HeroDao.js');
var Hero = require('./hero/Hero.js');
var Battle = require('./battle/Battle.js');
var BattleFactory = require('./battle/BattleFactory.js');
var MobFactory = require('./mob/MobFactory.js');

var MidgaardMainMap = require('./map/MidgaardMainMap.js');
var Coordinate = require('./map/Coordinate.js');
var Location = require('./map/Location.js');

var _appContext = new AppContext();
var _hero = null;
var _heroCache = {};
var _mobFactory = new MobFactory();

/*********** WEB SERVER ****************/
http.createServer(function (request, response) {
	//response.writeHead(200, {'Content-Type': 'text/plain'});
	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	response.setHeader('Access-Control-Allow-Credentials', true);

	_logger.logInfo("Request.url=" + request.url);
	_logger.logInfo("Request.method=" + request.method);

	if (request.url == "/about" && request.method == 'GET') {
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.write('{"author": "Michael Sundgaard", "company" : "Opus Magus"}');
		response.end();
	}

	else if (request.method == 'OPTIONS') {
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.end();
	}

	else if (request.method == 'POST') {
		var postData = "";

		request.on('data', function (chunk) {
			// append the current chunk of data to the postData variable
			postData += chunk.toString();
		});

		request.on('end', function () {		
			try {	
				var jsonResult = _router.route(request.url, postData);
				response.writeHead(jsonResult.httpStatusCode, { 'Content-Type': 'application/json' });
				response.write(JSON.stringify(jsonResult.jsonData));
			}
			catch(ex) {
				_logger.logError(ex);
				throw ex;
				response.writeHead(500, { 'Content-Type': 'application/json' });
				response.write('{ "reason": "' + ex + '"}');
			}
			response.end();
		});
	}

	else if (request.url == "/save" && request.method == 'POST') {
		var fullBody = '';

		request.on('data', function (chunk) {
			// append the current chunk of data to the fullBody variable
			fullBody += chunk.toString();
		});

		request.on('end', function () {
			// request ended -> do something with the data
			saveFile(fullBody);
			response.write('{ "status": "success"}');
			response.end();
		});
	}

	else if (request.url == "/equipItem" && request.method == 'POST') {
		var postData = '';

		request.on('data', function (chunk) {
			postData += chunk.toString();
		});

		request.on('end', function () {
			_logger.logInfo(postData);
			var gameSession = null;
			var serverLogin = null;

			try {
				gameSession = JSON.parse(postData);
				serverLogin = _loginCache[gameSession.publicKey]
			}
			catch (ex) {
				_logger.logError(ex);
			}

			if (serverLogin) {
				if (serverLogin.activeHero) {
					var currentMap = _mapFactory.create(serverLogin.activeHero.currentMapKey);
					var location = currentMap.getLocation(serverLogin.activeHero.currentCoordinates);
					response.writeHead(200, { 'Content-Type': 'application/json' });
					var data = null;
					_logger.logInfo("wants to equip an item!");

					if (location.town) {
						if (gameSession.itemKey) {
							var equipResponse = serverLogin.activeHero.equipItem(gameSession.itemKey, serverLogin.activeHero);
							data = { map: currentMap, hero: serverLogin.activeHero, town: location.town };
							data.equipResponse = equipResponse;
							_heroDao.save(serverLogin.activeHero);
						}
						else {
							_logger.logError("No hero selected!");
							response.writeHead(500, { 'Content-Type': 'application/json' });
							response.write('{ "error": "No hero selected!, please select one of your heroes, or create a new one!"}');
						}
					}
					else {
						data = { map: currentMap, hero: serverLogin.activeHero, reason: "You have to be in a town to visit the smithy!" };
					}
					response.write(JSON.stringify(data));
				}
				else {
					_logger.logError("No hero selected!");
					response.writeHead(500, { 'Content-Type': 'application/json' });
					response.write('{ "error": "No hero selected!, please select one of your heroes, or create a new one!"}');
				}
			}
			else {
				_logger.logError("Unable to find public key, please try to login again!");
				response.writeHead(500, { 'Content-Type': 'application/json' });
				response.write('{ "error": "Unable to find public key, please try to login again!"}');
			}

			response.end();
		});
	}

	else if (request.url == "/removeItem" && request.method == 'POST') {
		var postData = '';

		request.on('data', function (chunk) {
			postData += chunk.toString();
		});

		request.on('end', function () {
			_logger.logInfo(postData);
			var gameSession = null;
			var serverLogin = null;

			try {
				gameSession = JSON.parse(postData);
				serverLogin = _loginCache[gameSession.publicKey]
			}
			catch (ex) {
				_logger.logError(ex);
			}

			if (serverLogin) {
				if (serverLogin.activeHero) {
					var currentMap = _mapFactory.create(serverLogin.activeHero.currentMapKey);
					var location = currentMap.getLocation(serverLogin.activeHero.currentCoordinates);
					response.writeHead(200, { 'Content-Type': 'application/json' });
					var data = null;
					_logger.logInfo("wants to remove an item!");

					if (location.town) {
						if (gameSession.itemKey) {
							var removeResponse = serverLogin.activeHero.removeItem(gameSession.itemKey, serverLogin.activeHero);
							data = { map: currentMap, hero: serverLogin.activeHero, town: location.town };
							data.removeResponse = removeResponse;
							_heroDao.save(serverLogin.activeHero);
						}
						else {
							_logger.logError("No hero selected!");
							response.writeHead(500, { 'Content-Type': 'application/json' });
							response.write('{ "error": "No hero selected!, please select one of your heroes, or create a new one!"}');
						}
					}
					else {
						data = { map: currentMap, hero: serverLogin.activeHero, reason: "You have to be in a town to visit the smithy!" };
					}
					response.write(JSON.stringify(data));
				}
				else {
					_logger.logError("No hero selected!");
					response.writeHead(500, { 'Content-Type': 'application/json' });
					response.write('{ "error": "No hero selected!, please select one of your heroes, or create a new one!"}');
				}
			}
			else {
				_logger.logError("Unable to find public key, please try to login again!");
				response.writeHead(500, { 'Content-Type': 'application/json' });
				response.write('{ "error": "Unable to find public key, please try to login again!"}');
			}

			response.end();
		});
	}

	else {
		response.writeHead(500, { 'Content-Type': 'application/json' });
		response.write("Unhandled url requested or wrong data method defined!");
		response.end();
	}
}).listen(_appContext.getHostPort(), _appContext.getHostIp());

_logger.logInfo('Server running at http://' + _appContext.getHostIp() + ':' + _appContext.getHostPort());
