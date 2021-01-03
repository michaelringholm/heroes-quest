var _logger = require('../common/Logger.js');
var _guid = require('../common/GUID.js');

module.exports = function AppContext() {
	var _this = this;
	
	this.getAppRoot = function() {
		return "./";
	};
	
	this.getHostIp = function() {
		return "127.0.0.1";
		//return "192.168.0.24";
	};
	
	this.getHostPort = function() {
		return 1337;
	};	
	
	this.construct = function() {
		_logger.logInfo("AppContext.construct");
		for(var i=0;i<5;i++)
			_logger.logInfo(_guid.generateGUID());
  };
  
  _this.construct();
}
