function Logger() {

	var _this = this;
	
	this.logInfo = function(msg) {
		console.log('[INFO]:' + msg);
	};

	this.logError = function(msg) {
		console.error('[ERROR]:' + msg);
	};
		
	this.logWarn = function(msg) {
		console.warn('[WARN]:' + msg);
	};
}

module.exports = new Logger();