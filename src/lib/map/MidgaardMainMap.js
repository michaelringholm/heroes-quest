var Logger = require('../common/Logger.js');
const { construct } = require('../item/ItemFactory.js');
var MobFactory = require('../mob/MobFactory.js');
var Location = require('./Location.js');
var MapDAO = require('./MapDAO.js');
var Smithy = require('../town/Smithy.js');

function MidgaardMainMap(mapDTO) {
	var _this = this;
	this.mapDTO = mapDTO;
	this.key = "midgaard-main";
	this.name = "Midgaard main map";
	this.locations = new Array();
	this.mapMatrix = null;
	this.mapDefinition = null;
	var mobFactory = new MobFactory();
	
	var getTerrainType = function(terrainChar) {
		Logger.logInfo("terrainChar [" + terrainChar + "] translated into [" + _this.mapDefinition.terrainTypes[terrainChar].terrainType + "]");
		var mapDefinitionEntry = _this.mapDefinition.terrainTypes[terrainChar];
		
		if(mapDefinitionEntry)
			return mapDefinitionEntry.terrainType;
		
		return null;
	};
	
	var getTown = function(targetCoordinates) {	
		for(var townIndex in  _this.mapDefinition.towns) {
			if(_this.mapDefinition.towns[townIndex].x == targetCoordinates.x && _this.mapDefinition.towns[townIndex].y == targetCoordinates.y) {
				Logger.logInfo("Found the town of [" + _this.mapDefinition.towns[townIndex].name + "]!");
				var town = _this.mapDefinition.towns[townIndex];
				town.smithy = new Smithy();
				town.smithy.copper = 500;
				town.smithy.items = [{id: "f931ad6f-ef91-120d-9f2b-fde6a00757a6",name:"wooden sword",cost:1,atkMin:1,atkMax:3},{id: "b665d5fb-6ca9-5ac1-9efa-603407ab24c6", name:"long sword",cost:20,atkMin:2,atkMax:4},{id: "4a86074a-2ffb-a088-806f-c6c3f4fa98ae",name:"silver long sword",cost:1000,atkMin:3,atkMax:6}];	
				return town;
			}
		}
		throw new Error("No town found at location ["+JSON.stringify(targetCoordinates)+"]!");
	};
	
	this.getBaseTown = function() {
		return _this.mapDefinition.towns[0]
	};
	
	this.getLocation = function(targetCoordinates) {
		// Should figure out what is there
		if(!_this.mapDefinition) throw new Error("MapDefinition not loaded correctly!");
		if( (targetCoordinates.x >= 0 && targetCoordinates.x <= 18) && (targetCoordinates.y >= 0 && targetCoordinates.y <= 6)  ) {
			var possibleMobKeys = ["rat", "beetle", "spider"];
			var mobProbability = 0.5;
			var mob = null;
			var randomPropability = Math.random();
			Logger.logInfo("mobProbability = "  + mobProbability);
			Logger.logInfo("randomPropability = "  + randomPropability);
			
			if(randomPropability < mobProbability) {
				//var mobIndex = Math.Round(Math.random()*possibleMobKeys.length));
				//var mob = 
				Logger.logInfo("Monsters found!");
				mob = mobFactory.create();
			}
			else Logger.logInfo("No monsters here!");
			
			//Logger.logInfo("The raw map looks like this = [" + _this.rawMap + "]");
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
			Logger.logInfo("outside of map area!");
			return null;
		}
	};
	
	var construct = function() {
		Logger.logInfo("MidgaardMainMap.construct()");
		Logger.logInfo("mapDTO="+ JSON.stringify(_this.mapDTO));
		//var mob = mobFactory.create();
		_this.mapMatrix = _this.mapDTO.rawMap.match(/[^\r\n]+/g);
		_this.mapDefinition = JSON.parse(_this.mapDTO.mapDefinition);
	};

	construct();
}

module.exports = MidgaardMainMap;