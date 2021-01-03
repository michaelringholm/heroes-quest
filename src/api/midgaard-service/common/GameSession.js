var _logger = require('../common/Logger.js');
var _guid = require('../common/GUID.js');
var _crypto = require('crypto');

module.exports = 
function GameSession(loginName) {
	var _this = this;
	this.publicKey = "";
	this.data = {};

	this.construct = function (loginName) {
		_logger.logInfo("GameSession.construct called!");
		var loginNameSha256 = _crypto.createHash('sha256').update(loginName).digest("base64"); // could also be hex digest
		_this.publicKey = _guid.generateGUID() + "_" + loginNameSha256;
	};

	_this.construct(loginName);
}