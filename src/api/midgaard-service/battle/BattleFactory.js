var _logger = require('../common/Logger.js');
var Battle = require('./Battle.js');

function BattleFactory() {
	var _this = this;
		
    this.Create = function(battleDTO) {
        var battle = new BattleDTO(battleDTO.hero, battleDTO.mob);
        battle.round = battleDTO.round;
        battle.status = battleDTO.status;
        return battle;
    };
  
    this.construct = function() {
	    _logger.logInfo("BattleFactory.construct");		
    };
  
  _this.construct();
}

module.exports = new BattleFactory();