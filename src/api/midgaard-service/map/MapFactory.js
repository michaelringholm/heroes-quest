var _logger = require('../common/Logger.js');
var _mapDao = require('../map/MapDao.js');
var MidgaardMainMap = require('../map/MidgaardMainMap.js');

function MapFactory() {
	var _this = this;
	this.maps = {};
	
	this.create = function(mapKey) {
		_logger.logInfo("MapFactory.create");
		var map = _this.maps[mapKey];
		return map;
	};
	
	this.addMap = function(map) {
		_logger.logInfo("MapFactory.addMap");
		_this.maps[map.key] = map;
	};
	
	this.construct = function() {
		_logger.logInfo("MobFactory.construct");
		_this.addMap(new MidgaardMainMap(_mapDao));
	};
	
	_this.construct();
}

module.exports = new MapFactory();