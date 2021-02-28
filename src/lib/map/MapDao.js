var Logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var AWS = require("aws-sdk");
//var AppContext = require('./context/AppContext.js');
//var _appContext = new AppContext();

function MapDAO() {
	var _this = this;
	var bucketName = appContext.PREFIX+"map";
	var s3 = new AWS.S3({httpOptions:{connectTimeout:1000}});
	
		
	this.exists = function(fileName, callback) {
		Logger.logInfo("MapDao.exists");
		s3.listObjectsV2(
			{
				Bucket: bucketName,
				Prefix: fileName,
			}, 
			(err, s3Objects) => 
			{
				if (err) { Logger.logError("exists:"+err, err.stack); callback(err, false); return; }				
				Logger.logInfo("Objects in bucket are [" + JSON.stringify(s3Objects) + "]");
				if(s3Objects.KeyCount<1) { callback(null, false); return; }
				for(var i=0; i<s3Objects.Contents.length;i++) {					
					if(s3Objects.Contents[i].Key == fileName) { callback(null, true); return; }
				}
				callback(null, s3Objects.KeyCount==1);
				return;
			}
		);
	};

	this.existsAsync = async function(fileName) {
		Logger.logInfo("HeroDAO.exists");
		return new Promise((resolve, reject) => {
			s3.listObjectsV2(
				{
					Bucket: bucketName,
					Prefix: fileName
				}, 
				(err, s3Objects) => 
				{
					if (err) { Logger.logError("exists:"+err, err.stack); reject(err); }
					Logger.logInfo("Objects in bucket are [" + JSON.stringify(s3Objects) + "]");
					if(s3Objects.KeyCount<1) { resolve(false); return; }
					for(var i=0; i<s3Objects.Contents.length;i++) {					
						if(s3Objects.Contents[i].Key == fileName) resolve(true);
					}
					resolve(s3Objects.KeyCount==1);
				}
			);
		});
	};	

	this.loadAsync = async function(mapName) {
		Logger.logInfo("MapDao.load");
		var fileName = mapName + '.map';		
		var exists = this.existsAsync(fileName);
		if (!exists) { Logger.logError("Map file [" + fileName + "] does not exist!"); throw new Error("Map file [" + fileName + "] does not exist!"); ; }
		
		var params = {
			Bucket: bucketName, 
			Key: fileName
		};
		
		return new Promise((resolve, reject) => {
			s3.getObject(params, (err, rawMap) => {
				if (err) { Logger.logError("load:"+err, err.stack); reject(err); return; }
				Logger.logInfo("Map [" + mapName + "] loaded!");
				Logger.logInfo("Raw map is [" + rawMap.Body.toString() + "]!");
				resolve(rawMap.Body.toString());
			});		
		});
	};		
	
	this.load = function(mapName, callback) {
		Logger.logInfo("MapDao.load");
		var fileName = mapName + '.map';		
		this.exists(fileName, (err, exists)=> {
			if (err) { Logger.logError("load:"+err, err.stack); callback(err, false); return; }
			if (!exists) { Logger.logError("Map file [" + fileName + "] does not exist!"); callback("Map file [" + fileName + "] does not exist!", null); return; }
			var params = {
				Bucket: bucketName, 
				Key: fileName
			};
			s3.getObject(params, (err, rawMap) => {
				if (err) { Logger.logError("load:"+err, err.stack); callback(err, null); return; }
				Logger.logInfo("Map [" + mapName + "] loaded!");
				Logger.logInfo("Raw map is [" + rawMap.Body.toString() + "]!");
				callback(null, rawMap.Body.toString());
				return;
			});		
		});
	};
	
	this.loadDefinition = function(mapName, callback) {
		Logger.logInfo("MapDao.loadDefinition");
		var fileName = mapName + '.map.definition';
		
		this.exists(fileName, (err, exists)=> {
			if (err) { Logger.logError("load:"+err, err.stack); callback(err, false); return; }
			if (!exists) { Logger.logError("Map file [" + fileName + "] does not exist!"); callback("Map file [" + fileName + "] does not exist!", null); return; }
			var params = {
				Bucket: bucketName, 
				Key: fileName
			};
			s3.getObject(params, (err, mapDefinition) => {
				if (err) { Logger.logError("load:"+err, err.stack); callback(err, null); return; }
				Logger.logInfo("Map definition for [" + mapName + "] loaded!");
				Logger.logInfo("Map definition JSON is [" + mapDefinition.Body.toString() + "]!");
				callback(null, mapDefinition.Body.toString());
				return;
			});		
		});		
	};		

	this.loadDefinitionAsync = async function(mapName) {
		Logger.logInfo("MapDao.loadDefinitionAsync");
		var fileName = mapName + '.map.definition';
		var exists = await this.existsAsync(fileName);
		if (!exists) throw new Error("Map file [" + fileName + "] does not exist!");
		var params = {
			Bucket: bucketName, 
			Key: fileName
		};
		return new Promise((resolve, reject) => {
			s3.getObject(params, (err, mapDefinition) => {
				if (err) { Logger.logError("load:"+err, err.stack); reject(err); return; }
				Logger.logInfo("Map definition for [" + mapName + "] loaded!");
				Logger.logInfo("Map definition JSON is [" + mapDefinition.Body.toString() + "]!");
				resolve(mapDefinition.Body.toString());
			});		
		});
	};	
	
	this.construct = function() {
		Logger.logInfo("MapDao.construct");
  };
  
  _this.construct();
}

module.exports = new MapDAO();