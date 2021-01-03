var _logger = require('../common/Logger.js');
var Location = require('../map/Location.js');
var _mapDao = require('../map/MapDao.js');
var MobFactory = require('../mob/MobFactory.js');

module.exports = 
function MidgaardMainMap() {
	var _this = this;
	this.key = "midgaard-main";
	this.name = "Midgaard main map";
	this.locations = new Array();
	this.mapMatrix = null;
	this.mapDefinition = null;
	var mobFactory = new MobFactory();
	
	var getTerrainType = function(terrainChar) {
		_logger.logInfo("terrainChar [" + terrainChar + "] translated into [" + _this.mapDefinition.terrainTypes[terrainChar].terrainType + "]");
		var mapDefinitionEntry = _this.mapDefinition.terrainTypes[terrainChar];
		
		if(mapDefinitionEntry)
			return mapDefinitionEntry.terrainType;
		
		return null;
	};
	
	var getTown = function(targetCoordinates) {	
		for(var townIndex in  _this.mapDefinition.towns) {
			if(_this.mapDefinition.towns[townIndex].x == targetCoordinates.x && _this.mapDefinition.towns[townIndex].y == targetCoordinates.y) {
				_logger.logInfo("Found the town of [" + _this.mapDefinition.towns[townIndex].name + "]!");
				return _this.mapDefinition.towns[townIndex];
			}
		}

		return null;
	};
	
	this.getBaseTown = function() {
		return _this.mapDefinition.towns[0]
	};
	
	this.getLocation = function(targetCoordinates) {
		// Should figure out what is there
		if( (targetCoordinates.x >= 0 && targetCoordinates.x <= 18) && (targetCoordinates.y >= 0 && targetCoordinates.y <= 6)  ) {
			var possibleMobKeys = ["rat", "beetle", "spider"];
			var mobProbability = 0.5;
			var mob = null;
			var randomPropability = Math.random();
			_logger.logInfo("mobProbability = "  + mobProbability);
			_logger.logInfo("randomPropability = "  + randomPropability);
			
			if(randomPropability < mobProbability) {
				//var mobIndex = Math.Round(Math.random()*possibleMobKeys.length));
				//var mob = 
				_logger.logInfo("Monsters found!");
				var mob = mobFactory.create();
			}
			else
				_logger.logInfo("No monsters here!");
			
			//_logger.logInfo("The raw map looks like this = [" + _this.rawMap + "]");
			var terrainChar = _this.mapMatrix[targetCoordinates.y][targetCoordinates.x];
			
			if(terrainChar) {
				var terrainType = getTerrainType(terrainChar);
			
				var location = new Location({targetCoordinates:targetCoordinates, terrainType:terrainType, mob:mob});
				
				if(terrainType == "town") {
					var town = getTown(targetCoordinates); //{name:"Dolfjirheim"};
					location.town = town;
				}
								
				return location;
			}
			else
				return null;
		}
		else {
			_logger.logInfo("outside of map area!");
			return null;
		}
	};
	
	this.construct = function() {
		_logger.logInfo("MidgaardMainMap.construct");
		var mob = mobFactory.create();
		var rawMap = _mapDao.load(_this.key);
		_this.mapMatrix = rawMap.match(/[^\r\n]+/g);
		_this.mapDefinition = JSON.parse(_mapDao.loadDefinition(_this.key));
	};
	
	_this.construct();
}