var _logger = require('../../common/Logger.js');

function ItemFactory() {
	var _this = this;
	this.items = {};
	this.itemIds = new Array();
	this.itemCount = 2;
	
	this.create = function() {
		_logger.logInfo("ItemFactory.create");

		var randomIndex = Math.round(Math.random()*(_this.itemCount-1));
		var randomItem = null;
				
		if(randomIndex == 0) randomItem = {"id":"932a02b9-eac3-c9cb-8b47-ac94d336baf7", "name":"copper necklace", "type":"jewelry"};
		if(randomIndex == 1) randomItem = {"id":"e40aa6ef-3cf3-fd63-8a8a-960397d7a015", "name":"rabbits foot", "type":"amulet"};
		/*
		"boar-tusk"
		"wooden-club"
		"vial-of-blood"
		"rat pelt"
		"spider-leg"
		"wooden-club"
		"wolf pelt"
		"polished stone" 
		*/
	
		if(randomItem)
			_logger.logInfo(JSON.stringify(randomItem));
		else
			_logger.logError("No item found at index [" + randomIndex + "]!");
		
		return randomItem;
	};

	this.getItem = function(itemId) {
		_logger.logInfo("ItemFactory.getItem");
		var item = _this.items[itemId];
		if(!item)
			_logger.logError("Item with id [" + itemId + "] was not found!");
		return item;
	};
	
	this.addItem = function(item) {
		_logger.logInfo("ItemFactory.addItem");
		_logger.logInfo("name=" + item.id);
		_this.itemIds.push(item.id);		
		_this.items[item.id] = item;
	};
	
	this.construct = function() {
		_logger.logInfo("ItemFactory.construct");
		//_this.addMob({key: "orc", name: "Orc", hp:30, atk:4, luck:2, atkTypes:["melee"], xp:40, gold:0, silver:1, copper:6, items:[]});
	};
	
	_this.construct();
}

module.exports = new ItemFactory();