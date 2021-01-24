var _logger = require('../common/Logger.js');
var AWS = require("aws-sdk");
//var AppContext = require('./context/AppContext.js');
//var _appContext = new AppContext();

function MapDao() {
	var _this = this;
		
	this.exists = function(mapName) {
		_logger.logInfo("MapDao.exists");
		var fs = require("fs");
		var fileName = "./data/maps/" + mapName + '.map';
			
		var fileFound = true;
		try {
			fs.accessSync(fileName, fs.F_OK);
			_logger.logInfo("File [" + fileName + "] exists!");
		}
		catch(e) {
			fileFound = false;
			_logger.logWarn("File [" + fileName + "] does not exist!");
		}
		return fileFound;
	};
	
	this.load = function(mapName, callback) {
		_logger.logInfo("MapDao.load");
		var fileName = mapName + '.map';
		var s3 = new AWS.S3();
		var bucketName = "om-hq-map";
		var params = {
			Bucket: bucketName, 
			Key: fileName
		};
		s3.getObject(params, (err, rawMap) => {
			if (err) { _logger.logError(err, err.stack); callback(err, null); return; }
			_logger.logInfo("Map [" + mapName + "] loaded!");
			_logger.logInfo("Map JSON is [" + rawMap + "]!");
			callback(null, rawMap);
			return;
		});		
	};
	
	this.loadDefinition = function(mapName) {
		_logger.logInfo("MapDao.loadDefinition");
		var fs = require("fs");
		var fileName = "./data/maps/" + mapName + '.map.definition';
		
		var raw = fs.readFileSync(fileName).toString(); // Read map from S3 instead
		_logger.logInfo("Map definition for [" + mapName + "] loaded!");
		_logger.logInfo("Map definition JSON is [" + raw + "]!");
		
		return raw;
	};		
	
	this.construct = function() {
		_logger.logInfo("MapDao.construct");
  };
  
  _this.construct();
}

module.exports = new MapDao();