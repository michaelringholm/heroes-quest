var logger = require('../common/Logger.js');

module.exports = function MapDTO(anonObj) {
	var _this = this;
	this.rawMap = "";
	this.mapDefinition = {};
			
	this.construct = function() {
		logger.logInfo("MapDTO.construct");
    	for (var prop in anonObj) this[prop] = anonObj[prop];
  	};
  
  _this.construct();
}