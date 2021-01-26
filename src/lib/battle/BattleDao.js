var logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var Battle = require('./Battle.js');
var BattleFactory = require('./BattleFactory.js');
var AWS = require("aws-sdk");

function BattleDao() {
	var _this = this;
	var bucketName = appContext.PREFIX+"battle";
	var s3 = new AWS.S3();
		
	var exists = function() {
		logger.logInfo("BattleDao.exists");
		var fs = require("fs");
		var fileName = "./data/battles/" + "battles" + '.json';
			
		var fileFound = true;
		try {
			fs.statSync(fileName);
			logger.logInfo("File [" + fileName + "] exists!");
		}
		catch(e) {
			fileFound = false;
			logger.logWarn("File [" + fileName + "] does not exist!");
		}
		return fileFound;
	};
	
	this.load = function(callback) {
		logger.logInfo("BattleDao.load");
		var fileName = "battles.json";
		var params = {
			Bucket: bucketName, 
			Key: fileName
		};

		var s3 = new AWS.S3();
		s3.getObject(params, function(err, data) {
			if (err) { logger.logError(err, err.stack); callback(err, null); return; }
			console.log(data);
			callback();
			 /*
			 data = {
			  ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"", 
			  ServerSideEncryption: "AES256", 
			  VersionId: "Ri.vC6qVlA4dEnjgRV4ZHsHoFIjqEMNt"
			 }
			 */
		});		
		
		/*if(exists()) {
			var battlesJson = fs.readFileSync(fileName).toString();
			logger.logInfo("Battles JSON [" + battlesJson + "] loaded!");
			
			var battleDTOs = JSON.parse(battlesJson);
			//var battlesHashMap = {};
			//for(var battleDTOIndex in battleDTOs) {
			//	battlesHashMap[battleDTOIndex] = BattleFactory.Create(battleDTOs[battleDTOIndex]);
			//}
			return battleDTOs;
		}
		else
			return {};*/
	};	
	
	this.save = function(battleDTO, callback) {
		logger.logInfo("BattleDao.save");
		if(!callback) { logger.logWarn("BattleDao.save called with undefined callback!"); return; }
		if(battleDTO) {
			var fileName = "battles.json";			
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
				/*
				data = {
				ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"", 
				ServerSideEncryption: "AES256", 
				VersionId: "Ri.vC6qVlA4dEnjgRV4ZHsHoFIjqEMNt"
				}
				*/
			});
			var updateTime = new Date();
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