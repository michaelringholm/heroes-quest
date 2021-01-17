var _logger = require('../common/Logger.js');
var _mapDao = require('./MapDao.js');
var MidgaardMainMap = require('./MidgaardMainMap.js');

function MapDictionary() {
	var _this = this;
	this.maps = {};
	
	this.getMap = function(mapKey) {
		_logger.logInfo("MapFactory.getMap");
		var map = _this.maps[mapKey];
		return map;
	};
	
	this.addMap = function(map) {
		_logger.logInfo("MapFactory.addMap");
		_this.maps[map.key] = map;
	};
}

module.exports = new MapDictionary(); // Singleton