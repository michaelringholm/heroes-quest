var _logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var AWS = require("aws-sdk");
//var AppContext = require('./context/AppContext.js');
//var _appContext = new AppContext();

function MapDAO() {
	var _this = this;
	var bucketName = appContext.PREFIX+"map";
	var s3 = new AWS.S3();
		
	this.exists = function(fileName, callback) {
		_logger.logInfo("MapDao.exists");
		s3.listObjectsV2(
			{
				Bucket: bucketName,
				Prefix: fileName
			}, 
			(err, s3Objects) => 
			{
				if (err) { _logger.logError("exists:"+err, err.stack); callback(err, false); return; }				
				_logger.logInfo("Objects in bucket are [" + JSON.stringify(s3Objects) + "]");
				if(s3Objects.KeyCount<1) { callback(null, false); return; }
				for(var i=0; i<s3Objects.Contents.length;i++) {					
					if(s3Objects.Contents[i].Key == fileName) { callback(null, true); return; }
				}
				callback(null, s3Objects.KeyCount==1);
				return;
			}
		);
	};
	
	this.load = function(mapName, callback) {
		_logger.logInfo("MapDao.load");
		var fileName = mapName + '.map';		
		this.exists(fileName, (err, exists)=> {
			if (err) { _logger.logError("load:"+err, err.stack); callback(err, false); return; }
			if (!exists) { _logger.logError("Map file [" + fileName + "] does not exist!"); callback("Map file [" + fileName + "] does not exist!", null); return; }
			var params = {
				Bucket: bucketName, 
				Key: fileName
			};
			s3.getObject(params, (err, rawMap) => {
				if (err) { _logger.logError("load:"+err, err.stack); callback(err, null); return; }
				_logger.logInfo("Map [" + mapName + "] loaded!");
				_logger.logInfo("Raw map is [" + rawMap.Body.toString() + "]!");
				callback(null, rawMap.Body.toString());
				return;
			});		
		});
	};
	
	this.loadDefinition = function(mapName, callback) {
		_logger.logInfo("MapDao.loadDefinition");
		var fileName = mapName + '.map.definition';
		
		this.exists(fileName, (err, exists)=> {
			if (err) { _logger.logError("load:"+err, err.stack); callback(err, false); return; }
			if (!exists) { _logger.logError("Map file [" + fileName + "] does not exist!"); callback("Map file [" + fileName + "] does not exist!", null); return; }
			var params = {
				Bucket: bucketName, 
				Key: fileName
			};
			s3.getObject(params, (err, mapDefinition) => {
				if (err) { _logger.logError("load:"+err, err.stack); callback(err, null); return; }
				_logger.logInfo("Map definition for [" + mapName + "] loaded!");
				_logger.logInfo("Map definition JSON is [" + mapDefinition.Body.toString() + "]!");
				callback(null, mapDefinition.Body.toString());
				return;
			});		
		});		
	};		
	
	this.construct = function() {
		_logger.logInfo("MapDao.construct");
  };
  
  _this.construct();
}

module.exports = new MapDAO();