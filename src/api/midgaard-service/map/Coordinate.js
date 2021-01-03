var _logger = require('../common/Logger.js');

module.exports = 
function Coordinate(anonObj) {
	var _this = this;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	
	this.construct = function() {
		_logger.logInfo("Coordinate.construct");
    for (var prop in anonObj) this[prop] = anonObj[prop];
  };
  
  _this.construct();
}