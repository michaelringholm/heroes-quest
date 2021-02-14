var _logger = require('../common/Logger.js');

function BattleActions() {

	var _this = this;
	this.BattleActions = {MELEE:"melee",HEAL:"heal",CURSE:"curse"};

}

module.exports = new BattleActions(); // Singleton