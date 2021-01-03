var _logger = require('../common/Logger.js');
var AppContext = require('../context/AppContext.js');
var _appContext = new AppContext();

function MapDao() {
	var _this = this;
		
	this.exists = function(mapName) {
		_logger.logInfo("MapDao.exists");
		var fs = require("fs");
		var fileName = "./data/maps/" + mapName + '.map';
			
		var fileFound = true;
		try {
			fs.accessSync(fileName, fs.F_OK);
			_logger.logInfo("File [" + fileName + "] exists!");
		}
		catch(e) {
			fileFound = false;
			_logger.logWarn("File [" + fileName + "] does not exist!");
		}
		return fileFound;
	};
	
	this.load = function(mapName) {
		_logger.logInfo("MapDao.load");
		var fs = require("fs");
		var fileName = "./data/maps/" + mapName + '.map';
		
		var raw = fs.readFileSync(fileName).toString();
		_logger.logInfo("Map [" + mapName + "] loaded!");
		_logger.logInfo("Map JSON is [" + raw + "]!");
		
		return raw;
	};
	
	this.loadDefinition = function(mapName) {
		_logger.logInfo("MapDao.loadDefinition");
		var fs = require("fs");
		var fileName = "./data/maps/" + mapName + '.map.definition';
		
		var raw = fs.readFileSync(fileName).toString();
		_logger.logInfo("Map definition for [" + mapName + "] loaded!");
		_logger.logInfo("Map definition JSON is [" + raw + "]!");
		
		return raw;
	};		
	
	this.construct = function() {
		_logger.logInfo("MapDao.construct");
  };
  
  _this.construct();
}

module.exports = new MapDao();