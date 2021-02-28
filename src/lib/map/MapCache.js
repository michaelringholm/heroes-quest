var logger = require('../common/Logger.js');
var MapDTO = require('./MapDTO.js');
var MapDAO = require('./MapDAO.js');

function MapCache() {
	var _this = this;
	this.maps = {};

	this.getMapAsync = async function(mapKey, callback) {
		logger.logInfo("************* MapCache.getMap");
		logger.logInfo("mapKey=" + mapKey);
		var map = _this.maps[mapKey];
		if(!map) { //reload map
			var rawMap = await MapDAO.loadAsync(mapKey);
			var mapDTO = new MapDTO();
			mapDTO.rawMap = rawMap;
			var mapDefinition = await MapDAO.loadDefinitionAsync(mapKey);
			mapDTO.mapDefinition = mapDefinition;
			return mapDTO;
			//callback(null, mapDTO);
		}
		else return this.maps[mapKey];
			//callback(null, this.maps[mapKey]);
	};	
	
	this.getMap = function(mapKey, callback) {
		logger.logInfo("MapCache.getMap");
		logger.logInfo("mapKey=" + mapKey);
		var map = _this.maps[mapKey];
		if(!map) { //reload map
			MapDAO.load(mapKey, (err, rawMap) => {
				if(err) { callback(err, null); return; }
				var mapDTO = new MapDTO();
				mapDTO.rawMap = rawMap;
				MapDAO.loadDefinition(mapKey, (err, mapDefinition) => {
					if(err) { callback(err, null); return; }
					mapDTO.mapDefinition = mapDefinition;
					callback(null, mapDTO);
			   });
			});
		}
		else
			callback(null, this.maps[mapKey]);
	};
}

module.exports = new MapCache(); // Singleton