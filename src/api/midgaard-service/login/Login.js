var _logger = require('../common/Logger.js');

module.exports = function Login(name, password, heroes, id) {
	var _this = this;
	this.id = id;
	this.name = name;
	this.password = password;
	this.heroes = heroes;
	
	this.construct = function() {
		_logger.logInfo("Login.construct");
  };
  
  _this.construct();
}