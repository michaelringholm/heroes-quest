var { _logger } = require('../common/export.js');

module.exports = 
function Location(anonObj) {
	var _this = this;
	this.terrainType = "";
	this.mob = null;
	this.targetCoordinates = null;
	
	this.construct = function() {
		_logger.logInfo("Coordinate.construct");
    for (var prop in anonObj) this[prop] = anonObj[prop];
  };
  
  _this.construct();
}