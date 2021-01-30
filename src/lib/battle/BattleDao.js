var logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var Battle = require('./Battle.js');
var BattleFactory = require('./BattleFactory.js');
var AWS = require("aws-sdk");

function BattleDao() {
	var _this = this;
	var bucketName = appContext.PREFIX+"battle";
	var s3 = new AWS.S3();
		
	this.exists = function(fileName, callback) {
		logger.logInfo("BattleDao.exists");
		s3.listObjectsV2(
			{
				Bucket: bucketName,
				Prefix: fileName
			}, 
			(err, s3Objects) => 
			{
				if (err) { _logger.logError("exists:"+err, err.stack); callback(err, false); return; }				
				logger.logInfo("Objects in bucket are [" + JSON.stringify(s3Objects) + "]");
				if(s3Objects.KeyCount<1) { callback(null, false); return; }
				for(var i=0; i<s3Objects.Contents.length;i++) {					
					if(s3Objects.Contents[i].Key == fileName) { callback(null, true); return; }
				}
				callback(null, s3Objects.KeyCount==1);
				return;
			}
		);
	};
	
	this.load = function(heroKey, callback) {
		logger.logInfo("BattleDao.load");
		var fileName = "battle-" + heroKey + ".json";
		this.exists(fileName, (err, exists)=> {
			if (err) { logger.logError("load:"+err, err.stack); callback(err, false); return; }
			if (!exists) { logger.logError("Battle file [" + fileName + "] does not exist!"); callback("Battle file [" + fileName + "] does not exist!", null); return; }
			var params = {
				Bucket: bucketName, 
				Key: fileName
			};

			var s3 = new AWS.S3();
			s3.getObject(params, function(err, s3Object) {
				if (err) { logger.logError(err, err.stack); callback(err, null); return; }
				logger.logInfo(JSON.stringify(s3Object));
				var battleDTO = JSON.parse(s3Object.Body);
				callback(null, battleDTO);
			});		
		});
	};	
	
	this.save = function(heroKey, battleDTO, callback) {
		logger.logInfo("BattleDao.save");
		if(!callback) { logger.logWarn("BattleDao.save called with undefined callback!"); return; }
		if(battleDTO) {
			var fileName = "battle-" + heroKey + ".json";
			this.exists(fileName, (err, exists)=> {
				if (err) { logger.logError("load:"+err, err.stack); callback(err, false); return; }
				if (!exists) { logger.logError("Battle file [" + fileName + "] does not exist!"); callback("Battle file [" + fileName + "] does not exist!", null); return; }
				var params = {
					Body: JSON.stringify(battleDTO),
					Bucket: bucketName, 
					Key: fileName
				};
				var s3 = new AWS.S3();
				logger.logInfo("BattleDao.save(1)");			
				s3.putObject(params, function(err, data) {
					if (err) { logger.logError("save:"+err, err.stack); callback(err, null); return; }
					logger.logInfo("BattleDao.save(2)");
					logger.logInfo(data);
					callback(null, true);
				});
				var updateTime = new Date();
			});
		}
		else
			logger.error("Skipping save of battles as the battles hashmap in invalid!");
	};	
	
	this.construct = function() {
		logger.logInfo("BattleDao.construct");
  };
  
  _this.construct();
}

module.exports = new BattleDao();