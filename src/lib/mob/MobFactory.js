var _logger = require('../common/Logger.js');
var _itemFactory = require('../item/ItemFactory.js');

function MobFactory() {
	var _this = this;
	this.mobs = {};
	//this.mobKeys = new Array();
	this.mobCount = 9;
	
	this.create = function() {
		_logger.logInfo("MobFactory.create");

		var randomIndex = Math.round(Math.random()*(_this.mobCount-1));

		var randomMob = null;

		var item = _itemFactory.create();
		if(randomIndex == 0) randomMob = {key: "wild-boar", name: "Wild boar", baseHp:20, hp:20, minAtk:1, maxAtk:4, ac:1,  regen:0, luck:2, atkTypes:["melee"], xp:15, copper:6, items:[item]};
		if(randomIndex == 1) randomMob = {key: "cave-troll", name: "Cave troll", baseHp:80, hp:80, minAtk:4, maxAtk:10, ac:5,  regen:3, luck:2, atkTypes:["melee"], xp:500, copper:500, items:[item]};		
		if(randomIndex == 2) randomMob = {key: "leech", name: "Leech", baseHp:22, hp:22, minAtk:1, maxAtk:3, ac:0,  regen:1, luck:2, atkTypes:["melee"], xp:7, copper:4, items:[item]};
		if(randomIndex == 3) randomMob = {key: "rat", name: "Rat", baseHp:12, hp:12, minAtk:1, maxAtk:2, ac:0,  regen:1, luck:2, atkTypes:["melee", "poison I"], xp:5, copper:2, items:[item]};
		if(randomIndex == 4) randomMob = {key: "giant-spider", name: "Giant spider", baseHp:36, hp:36, minAtk:3, maxAtk:6, ac:3,  regen:1, luck:2, atkTypes:["melee", "poison I"], xp:95, copper:100, items:[item]};
		if(randomIndex == 5) randomMob = {key: "troll", name: "Troll", baseHp:65, hp:65, minAtk:3, maxAtk:8, ac:4,  regen:2, luck:2, atkTypes:["melee"], xp:300, copper:360, items:[item]};
		if(randomIndex == 6) randomMob = {key: "wolf", name: "Wolf", baseHp:19, hp:19, minAtk:1, maxAtk:4, ac:1,  regen:0, luck:2, atkTypes:["melee"], xp:8, copper:5, items:[item]};		
		if(randomIndex == 7) randomMob = {key: "deer", name: "Deer", baseHp:12, hp:12, minAtk:1, maxAtk:3, ac:2,  regen:0, luck:4, atkTypes:["melee"], xp:5, copper:0, items:[item]};		
		if(randomIndex == 8) randomMob = {key: "shadow", name: "Shadow", baseHp:28, hp:28, minAtk:3, maxAtk:5, ac:4,  regen:0, luck:2, atkTypes:["melee"], xp:160, copper:85, items:[item]};
		
		if(randomMob)
			_logger.logInfo(JSON.stringify(randomMob));
		else
			_logger.logError("No mob found at index [" + randomIndex + "]!");
		
		return randomMob;
	};
	
	this.addMob = function(mob) {
		_logger.logInfo("MobFactory.addMob");
		_logger.logInfo("name=" + mob.key);
		_this.mobKeys.push(mob.key);		
		_this.mobs[mob.key] = mob;
	};
	
	this.construct = function() {
		_logger.logInfo("MobFactory.construct");
		//_this.addMob({key: "orc", name: "Orc", hp:30, atk:4, luck:2, atkTypes:["melee"], xp:40, gold:0, silver:1, copper:6, items:[]});
	};
	
	_this.construct();
}

module.exports = MobFactory;