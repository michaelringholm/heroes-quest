var Logger = require('../common/Logger.js');
var Battle = require('../battle/Battle.js');
var BattleDTO = require('../battle/BattleDTO.js');
var BattleDAO = require('../battle/BattleDAO.js');
var HeroDAO = require('./HeroDAO.js');
var Coordinate = require('../map/Coordinate.js');
var MidgaardMainMap = require('../map/MidgaardMainMap.js');
var MapCache = require('../map/MapCache.js');
var _itemFactory = require('../item/ItemFactory.js');
var HeroDAO = require('./HeroDAO.js');

module.exports = function Hero(heroDTO) {	
	var _this = this;
	this.heroDTO = heroDTO;
	this.battleDTO;
	this.userGuid;
	this.equipItem = function(itemId) {		
		// Find and remove equipped item from inventory
		var itemIndexToRemove = -1;
		for(var itemIndex in _this.heroDTO.items) {
			if (items[itemIndex].id == itemId) {
				itemIndexToRemove = itemIndex;
				break;
			}
		}
		
		if (itemIndexToRemove > -1)  {
			items.splice(itemIndexToRemove, 1);
		}
		else
			return { status: false, reason:"Hero does not have that item!" };
		
		var item = _itemFactory.create(itemId); // Get full item as we need to know the slot
		var currentlyEquippedItem = _this.heroDTO.equippedItems[item.slot];
		
		if (currentlyEquippedItem) {
			items.push(currentlyEquippedItem); // Put the currently equipped item back into the inventory	if one exists
		}
		_this.equippedItems[item.slot] = itemId;
		
		return { status: true, reason:"Item equipped!" };
	};
	
	this.removeItem = function(itemId) {
		var item = _itemFactory.create(itemId); // Get full item as we need to know the slot
		var currentlyEquippedItem = _this.heroDTO.equippedItems[item.slot];
		
		if (currentlyEquippedItem) {
			_this.heroDTO.items.push(currentlyEquippedItem); // Put the currently equipped item back into the inventory	if one exists
			_this.heroDTO.equippedItems[item.slot] = null;
			return { status: true, reason:"Item removed and put in inventory!" };
		}
		else
			return { status: false, reason:"Item was not equipped, nothing to remove!" };
	};

	this.getHeroKey = function(userGuid, heroName) {
		return userGuid+"#"+heroName;
	};

	this.moveAsync = async function(userGuid, heroDTO, direction, map)  {
		Logger.logInfo("Hero.moveAsync");
		var targetCoordinates = new Coordinate(_this.heroDTO.currentCoordinates);
		if(direction == "west")
			targetCoordinates.x--;
		else if(direction == "east")
			targetCoordinates.x++;
		else if(direction == "north")
			targetCoordinates.y--;		
		else if(direction == "south")
			targetCoordinates.y++;
		
		_this.heroKey = _this.getHeroKey(userGuid, heroDTO.heroName);
		_this.userGuid = userGuid;
		Logger.logInfo("targetCoordinates=[" + JSON.stringify(targetCoordinates) + "]");
		
		var targetLocation = map.getLocation(targetCoordinates);
		
		if(targetLocation) {
			_this.heroDTO.currentCoordinates = targetCoordinates;
			if(targetLocation.mob) {
				//battleCache[_this.heroDTO.heroId] = new BattleDTO(_this.heroDTO, targetLocation.mob);
				Logger.logInfo("Mob found at location, entering battle!");
				_this.battleDTO = new BattleDTO(_this.heroDTO, targetLocation.mob);				
				saveStateAsync();
				return { newLocation: targetLocation, battle: _this.battleDTO }
			}
			else return { newLocation: targetLocation, battle: null };
		}
		else throw new Error("Invalid location");
	};
	
	// east, west, north, south, up, down
	this.move = function(userGuid, heroDTO, direction, map, callback)  {
		Logger.logInfo("Hero.move");
		var targetCoordinates = new Coordinate(_this.heroDTO.currentCoordinates);
		if(direction == "west")
			targetCoordinates.x--;
		else if(direction == "east")
			targetCoordinates.x++;
		else if(direction == "north")
			targetCoordinates.y--;		
		else if(direction == "south")
			targetCoordinates.y++;
		
		_this.heroKey = _this.getHeroKey(userGuid, heroDTO.heroName);
		_this.userGuid = userGuid;
		Logger.logInfo("targetCoordinates=[" + JSON.stringify(targetCoordinates) + "]");
		
		var targetLocation = map.getLocation(targetCoordinates);
		
		if(targetLocation) {
			_this.heroDTO.currentCoordinates = targetCoordinates;
			if(targetLocation.mob) {
				//battleCache[_this.heroDTO.heroId] = new BattleDTO(_this.heroDTO, targetLocation.mob);
				Logger.logInfo("Mob found at location, entering battle!");
				_this.battleDTO = new BattleDTO(_this.heroDTO, targetLocation.mob);				
				saveState((err, data) => {
					if (err) { Logger.logError("move(3):"+err, err.stack); callback(err, null); return; }
					callback(null, { newLocation: targetLocation, battle: _this.battleDTO }); return;
				});				
			}
			else
				callback(null, { newLocation: targetLocation, battle: null }); return;
		}
		else
			callback("Invalid location", null);
	};

	var saveStateAsync = async function() {
		Logger.logInfo("Hero.saveStateAsync");
		var savedObj = BattleDAO.saveAsync(_this.heroKey, _this.battleDTO);
		_this.heroDTO.isInBattle = true;
		var heroDTO = HeroDAO.saveAsync(_this.userGuid, _this.heroDTO);
		return heroDTO;
	};	

	var saveState = function(callback) {
		Logger.logInfo("Hero.saveState");
		BattleDAO.save(_this.heroKey, _this.battleDTO, (err, saved)=> {
			if (err) { Logger.logError("move(1):"+err, err.stack); callback(err, null); return; }
			_this.heroDTO.isInBattle = true;
			HeroDAO.save(_this.userGuid, _this.heroDTO, (err, heroDTO)=> {
				if (err) { Logger.logError("move(4):"+err, err.stack); callback(err, null); return; }
				callback(null, heroDTO);
			});
		});
	};
	
	this.visitMeadhall = function(userGuid, heroDTO, callback) {
		if(_this.heroDTO.copper > 0) {
			_this.heroDTO.copper -= 1;
			_this.heroDTO.hp = _this.heroDTO.baseHp;
			_this.heroDTO.mana = _this.heroDTO.baseMana;
			_this.heroDTO.rested = true;
			HeroDAO.save(userGuid, heroDTO, (err, heroDTO) => {
				if(err) { Logger.logError(err); callback("Failed to save hero:" + err, null); return; }
				callback(null, {success:true, rested:true, hero:heroDTO});
			});
		}
		else {
			var reason = "Not enough money to visit the mead hall, you need at least 1 copper!";
			callback(null, {success:false, rested:false});
		}
	};

	this.enterTown = function(loginDTO, heroDTO, callback) {
		if(heroDTO.isInBattle) { Logger.logError("Hero is in battle, can't enter town"); callback("Hero is in battle, can't enter town", null); return; }
		heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
		MapCache.getMap(heroDTO.currentMapKey, (err, mapDTO) => {
			if(err) { Logger.logError(err); callback("Failed to enter town:" + err, null); return; }
			var map = new MidgaardMainMap();
			map.build(mapDTO);
			var location = map.getLocation(heroDTO.currentCoordinates);
			var data = { hero: heroDTO, map: map, location: location };
			callback(null, data);
		});
	};

	this.leaveTown = function(loginDTO, heroDTO, callback) {
		if(heroDTO.isInBattle) { Logger.logError("Hero is in battle, can't leave town"); callback("Hero is in battle, can't leave town", null); return; }
		heroDTO.heroKey = loginDTO.userGuid+"#"+heroDTO.heroName;
		MapCache.getMap(heroDTO.currentMapKey, (err, mapDTO) => {
			if(err) { Logger.logError(err); callback("Failed to et map:" + err, null); return; }
			var map = new MidgaardMainMap();
			map.build(mapDTO);
			var location = map.getLocation(heroDTO.currentCoordinates);
			var data = { hero: heroDTO, map: map, location: location };
			callback(null, data);
		});
	};	
	
	this.getXpTarget = function() {
		return _this.heroDTO.level*_this.heroDTO.level*1000;
	}
	
	this.train = function() {
		var xpTarget = _this.getXpTarget();
		
		if(_this.heroDTO.xp >= xpTarget) {		
			var cost = _this.heroDTO.level*_this.heroDTO.level*100;
			if(_this.heroDTO.copper >= cost) {
				_this.heroDTO.copper -= cost;
				
				 var extraHp = Math.round(((Math.random()*2)*(_this.heroDTO.sta/3))+1);
				 var extraMana = Math.round(((Math.random()*2)*(_this.heroDTO.int/3))+1);
				 
				 _this.heroDTO.baseHp += extraHp;
				 _this.heroDTO.baseMana += extraMana;
				 _this.heroDTO.level++;
				return {trained:true};
			}
			else {
				var errMsg = "Not enough money to train, you need at least [" + cost + "] copper!";
				Logger.logError(errMsg);
				return {trained:false, reason:errMsg};
			}
		}
		else {
			var errMsg = "Not enough xp to train, you need [" + (xpTarget-_this.heroDTO.xp*1) + "] more XP to become level [" + (_this.heroDTO.level+1) + "]!";
			Logger.logError(errMsg);
			return {trained:false, reason:errMsg};
		}
	};
	
	this.died = function(mob, callback) {
		_this.heroDTO.xp -= (mob.xp*10);
		
		if (_this.heroDTO.sta > 1) {
			_this.heroDTO.sta -= 1;
		}
		
		_this.heroDTO.hp = 1;
		_this.heroDTO.conditions = [];
		_this.heroDTO.mana = _this.heroDTO.baseMana;
		MapCache.getMap(_this.heroDTO.currentMapKey, (err, mapDTO) => {
			var baseTown = new MidgaardMainMap().build(mapDTO).getBaseTown();
			_this.heroDTO.currentCoordinates.x = baseTown.x;
			_this.heroDTO.currentCoordinates.y = baseTown.y;
			callback(null, _this.heroDTO);
		})
	};
	
	this.construct = function() {
		Logger.logInfo("Hero.construct");
    	//for (var prop in anonObj) this[prop] = anonObj[prop];
  	};
  
  _this.construct();
}