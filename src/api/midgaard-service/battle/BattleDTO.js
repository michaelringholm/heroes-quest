var _logger = require('../common/Logger.js');

module.exports = 
function BattleDTO(hero, mob) {
	var _this = this;
	if(!hero || !mob) {
		_logger.logError("Hero or mob was null!");
		return;
	}
	
	this.round = 0;
	this.hero = hero;
  this.mob =  mob;
	this.status = {over:false, winner:"", loser:""};
   
  this.construct = function() {
		_logger.logInfo("BattleDTO.construct");
  };
  
  _this.construct();
}