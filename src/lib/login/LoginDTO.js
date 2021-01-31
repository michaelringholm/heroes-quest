var _logger = require('../common/Logger.js');
var Battle = require('../battle/Battle.js');
var Coordinate = require('../map/Coordinate.js');
var _mapDao = require('../map/MapDAO.js');
var _battleDao = require('../battle/BattleDAO.js');
var _itemFactory = require('../item/ItemFactory.js');

module.exports = function Hero(anonObj) {
	var _this = this;
	this.heroName = "";
	this.heroId = "";
	this.heroClass = "warrior";
	this.baseHp = 0;
	this.hp = 0;
	this.baseMana = 0;
	this.mana = 0;
	this.xp = 0;
	this.level = 1;
	this.str = 0;
	this.sta = 0;
	this.int = 0;
	this.minAtk = 1;
	this.maxAtk = 6;
	this.regen = 0;
	this.baseAc = 0;
	this.ac = 0;
	this.luck = 0;
	this.gold = 0;
	this.silver = 0;
	this.copper = 0;
	this.items = [];
	this.equippedItems = {};
	this.atkTypes = [];
	this.currentMapKey = "";
	this.currentCoordinates = {};
	this.rested = false;
			
	this.construct = function() {
		_logger.logInfo("HeroDTO.construct");
    	for (var prop in anonObj) this[prop] = anonObj[prop];
  	};
  
  _this.construct();
}