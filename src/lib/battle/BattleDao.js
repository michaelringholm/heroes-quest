var Logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var Battle = require('./Battle.js');
var BattleFactory = require('./BattleFactory.js');
var AWS = require("aws-sdk");

function BattleDao() {
	var _this = this;
	var bucketName = appContext.PREFIX+"battle";
	var s3 = new AWS.S3();
		
	this.exists = function(fileName, callback) {
		Logger.logInfo("BattleDao.exists");
		s3.listObjectsV2(
			{
				Bucket: bucketName,
				Prefix: fileName
			}, 
			(err, s3Objects) => 
			{
				if (err) { _Logger.logError("exists:"+err, err.stack); callback(err, false); return; }				
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

	this.loadAsync = async function(heroKey) {
		Logger.logInfo("BattleDao.load");
		var fileName = "battle-" + heroKey + ".json";
		var exists = this.existsAsync(fileName);
		if (!exists) { Logger.logError("Battle file [" + fileName + "] does not exist!"); throw new Error("Battle file [" + fileName + "] does not exist!"); }
		var params = {
			Bucket: bucketName, 
			Key: fileName
		};

		return new Promise((resolve, reject) => {
			s3.getObject(params, function(err, s3Object) {
				if (err) { Logger.logError(err, err.stack); reject(err); return; }
				Logger.logInfo("BattleJSON=" + s3Object.Body);
				var battleDTO = JSON.parse(s3Object.Body);
				resolve(battleDTO);
			});		
		});
	};	

	this.load = function(heroKey, callback) {
		Logger.logInfo("BattleDao.load");
		var fileName = "battle-" + heroKey + ".json";
		this.exists(fileName, (err, exists)=> {
			if (err) { Logger.logError("load:"+err, err.stack); callback(err, false); return; }
			if (!exists) { Logger.logError("Battle file [" + fileName + "] does not exist!"); callback("Battle file [" + fileName + "] does not exist!", null); return; }
			var params = {
				Bucket: bucketName, 
				Key: fileName
			};

			var s3 = new AWS.S3();
			s3.getObject(params, function(err, s3Object) {
				if (err) { Logger.logError(err, err.stack); callback(err, null); return; }
				Logger.logInfo("BattleJSON=" + s3Object.Body);
				var battleDTO = JSON.parse(s3Object.Body);
				callback(null, battleDTO);
			});		
		});
	};	
	
	this.saveAsync = async function(heroKey, battleDTO) {
		Logger.logInfo("BattleDao.saveAsync");
		if(!callback) { Logger.logWarn("BattleDao.save called with undefined callback!"); Logger.logWarn(new Error().stack); return; }
		if(battleDTO) {
			var fileName = "battle-" + heroKey + ".json";
			var params = {
				Body: JSON.stringify(battleDTO),
				Bucket: bucketName, 
				Key: fileName
			};
			return new Promise((resolve, reject) => {				
				s3.putObject(params, function(err, data) {
					if (err) { Logger.logError("save:"+err, err.stack); reject(err); return; }
					Logger.logInfo(JSON.stringify(data));
					resolve(battleDTO);
				});
			});
		}
		else
			Logger.error("Skipping save of battles as the battles hashmap in invalid!");
	};	

	this.save = function(heroKey, battleDTO, callback) {
		Logger.logInfo("BattleDao.save");
		if(!callback) { Logger.logWarn("BattleDao.save called with undefined callback!"); Logger.logWarn(new Error().stack); return; }
		if(battleDTO) {
			var fileName = "battle-" + heroKey + ".json";
			//this.exists(fileName, (err, exists)=> {
				//if (err) { Logger.logError("load:"+err, err.stack); callback(err, false); return; }
				//if (!exists) { Logger.logError("Battle file [" + fileName + "] does not exist!"); callback("Battle file [" + fileName + "] does not exist!", null); return; }
				var params = {
					Body: JSON.stringify(battleDTO),
					Bucket: bucketName, 
					Key: fileName
				};
				var s3 = new AWS.S3();
				Logger.logInfo("BattleDao.save(1)");			
				s3.putObject(params, function(err, data) {
					if (err) { Logger.logError("save:"+err, err.stack); callback(err, null); return; }
					Logger.logInfo("BattleDao.save(2)");
					Logger.logInfo(JSON.stringify(data));
					callback(null, battleDTO);
				});
				var updateTime = new Date();
			//});
		}
		else
			Logger.error("Skipping save of battles as the battles hashmap in invalid!");
	};	
	
	this.construct = function() {
		Logger.logInfo("BattleDao.construct");
  };
  
  _this.construct();
}

module.exports = new BattleDao();