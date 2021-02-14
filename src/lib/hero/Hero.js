var Logger = require('../common/Logger.js');
var Battle = require('../battle/Battle.js');
var BattleDTO = require('../battle/BattleDTO.js');
var _battleDao = require('../battle/BattleDAO.js');
var _heroDao = require('./HeroDAO.js');
var Coordinate = require('../map/Coordinate.js');
var MidgaardMainMap = require('../map/MidgaardMainMap.js');
var MapCache = require('../map/MapCache.js');
var _itemFactory = require('../item/ItemFactory.js');

module.exports = function Hero(heroDTO) {	
	var _this = this;
	this.heroDTO = heroDTO;
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
	
	// east, west, north, south, up, down
	this.move = function(requestInput, heroDTO, direction, map, callback)  {
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
		
		Logger.logInfo("targetCoordinates=[" + JSON.stringify(targetCoordinates) + "]");
		
		var targetLocation = map.getLocation(targetCoordinates);
		
		if(targetLocation) {
			_this.heroDTO.currentCoordinates = targetCoordinates;
			if(targetLocation.mob) {
				//battleCache[_this.heroDTO.heroId] = new BattleDTO(_this.heroDTO, targetLocation.mob);
				Logger.logInfo("Mob found at location, entering battle!");
				var battleDTO = new BattleDTO(_this.heroDTO, targetLocation.mob);
				var heroKey = _this.getHeroKey(requestInput.userGuid, heroDTO.heroName);
				_battleDao.save(heroKey, battleDTO, (err, saved)=> {
					if (err) { Logger.logError("move(1):"+err, err.stack); callback(err, null); return; }
					heroDTO.isInBattle = true;
					_heroDao.updateBattleStatus(requestInput.userGuid, heroDTO.heroName, true, (err, saved)=> {
						if (err) { Logger.logError("move(2):"+err, err.stack); callback(err, null); return; }
						callback(null, { newLocation: targetLocation, battle: battleDTO });
						return ;
					});
				});				
			}
			else
				callback(null, { newLocation: targetLocation, battle: null });
		}
		else
			callback("Invalid location", null);
	};
	
	this.visitMeadhall = function() {
		if(_this.heroDTO.copper > 0) {
			_this.heroDTO.copper -= 1;
			_this.heroDTO.hp = _this.heroDTO.baseHp;
			_this.heroDTO.mana = _this.heroDTO.baseMana;
			_this.heroDTO.rested = true;
			return {success:true};
		}
		else {
			var reason = "Not enough money to visit the mead hall, you need at least 1 copper!";
			Logger.logError(reason);
			return {success:false, reason:reason};
		}
	};

	this.enterTown = function(loginDTO, heroDTO, callback) {
		if(heroDTO.isInBattle) { Logger.logError("Hero is in battle, can't enter town"); callback("Hero is in battle, can't enter town", null); return; }
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