var _logger = require('../common/Logger.js');
var Battle = require('../battle/Battle.js');
var Coordinate = require('../map/Coordinate.js');
var _mapDao = require('../map/MapDAO.js');
var _battleDao = require('../battle/BattleDAO.js');
var _itemFactory = require('../item/ItemFactory.js');
var CONSTS = require('../common/Constants.js');

module.exports = function Hero(anonObj) {	
	var _this = this;
	this.heroName = "";
	this.heroId = "";
	this.heroClass = "WARRIOR";
	this.baseHp = 20;
	this.hp = 20;
	this.baseMana = 10;
	this.mana = 10;
	this.xp = 0;
	this.level = 1;
	this.str = 10;
	this.sta = 10;
	this.int = 10;
	this.minAtk = 1;
	this.maxAtk = 6;
	this.regen = 1;
	this.baseAc = 0;
	this.ac = 0;
	this.luck = 0;
	this.gold = 0;
	this.silver = 0;
	this.copper = 0;
	this.items = [];
	this.equippedItems = {};
	this.atkTypes = [];
	this.currentMapKey = "midgaard-main";
	this.currentCoordinates = {x:0, y:0};
	this.rested = false;
	this.gender = CONSTS.GENDERS.FEMALE;
			
	this.construct = function() {
		_logger.logInfo("HeroDTO.construct");
    	for (var prop in anonObj) this[prop] = anonObj[prop];
  	};
  
  _this.construct();
}