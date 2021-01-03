var _logger = require('../common/Logger.js');
var AppContext = require('../context/AppContext.js');
var _appContext = new AppContext();
var _heroDao = require('../hero/HeroDao.js');

function LoginDao() {
	var _this = this;
	var loginHeaderMap = {};
	this.Cache = {};	

	var loadLoginHeaders = function() {
		_logger.logInfo("LoginDao.loadLoginHeaders");
		var fs = require("fs");
		var fileName = _appContext.getAppRoot() + "data/logins/login-headers.json";
			
		var fileFound = true;
		try {
			fs.statSync(fileName);			
			var loginHeadersJson = fs.readFileSync(fileName).toString();
			_logger.logInfo("LoginHeaders JSON [" + loginHeadersJson + "] loaded!");
			var loginHeaders = JSON.parse(loginHeadersJson);
			for(var i=0;i<loginHeaders.logins.length;i++) {
				var loginHeader = loginHeaders.logins[i];
				loginHeaderMap[loginHeader.loginName] = loginHeader;
			}
		}
		catch(e) {
			fileFound = false;
			_logger.logError(e);
			_logger.logError("File [" + fileName + "] does not exist!");
		}
	};	
		
	this.exists = function(loginName) {
		_logger.logInfo("LoginDao.exists");
		var fs = require("fs");
		var loginHeader = loginHeaderMap[loginName];
		var fileName = _appContext.getAppRoot() + "data/logins/" + loginHeader.loginId + '.login.json';
			
		var fileFound = true;
		try {
			fs.statSync(fileName);
			_logger.logInfo("File [" + fileName + "] exists!");
		}
		catch(e) {
			fileFound = false;
			_logger.logError(JSON.stringify(e));
			_logger.logError("File [" + fileName + "] does not exist!");
		}
		return fileFound;
	};
	
	this.load = function(loginName) {
		_logger.logInfo("LoginDao.load");
		var fs = require("fs");
		var loginHeader = loginHeaderMap[loginName];
		var fileName = _appContext.getAppRoot() + "data/logins/" + loginHeader.loginId + ".login.json";
		var login = null;
		
		var loginJson = fs.readFileSync(fileName).toString();

		_logger.logInfo("Login JSON [" + loginJson + "] loaded!");		
		login = JSON.parse(loginJson);
		login.heroes = new Array();
		for(var heroIndex in login.heroIds) {
			var hero = _heroDao.load(login.heroIds[heroIndex]);
			login.heroes.push(hero);
		}
		_logger.logInfo("Login [" + JSON.stringify(login) + "] loaded!");		
		
		return login;
	};	
	
	this.save = function(login) {
		_logger.logInfo("LoginDao.save");
		var fs = require("fs");
		var fileName = _appContext.getAppRoot() + "data/logins/" + login.name + ".login.json";
		
		var updateTime = new Date();

		fs.writeFile(fileName, JSON.stringify(login),  function(err) {
			if (err) {
				return console.error(err);
			}
			console.log("Data written successfully!");
		});
	};	
	
	this.construct = function() {
		_logger.logInfo("LoginDao.construct");
		loadLoginHeaders();
  };
  
  _this.construct();
}

module.exports = new LoginDao();