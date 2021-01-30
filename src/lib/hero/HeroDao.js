var logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var FV = require('../common/field-verifier.js');
var HeroDTO = require('./HeroDTO.js');
var AWS = require("aws-sdk");

function HeroDao() {
	var _this = this;
	if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
	
	this.exists = function(heroId) {
		logger.logInfo("HeroDao.exists");
		var fs = require("fs");
		var fileName = "./data/heroes/" + heroId + '.hero.json';
			
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
	
	this.load = function(userGuid, heroName, callback) {
		logger.logInfo("HeroDao.load");
		if(!userGuid) { logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		if(!heroName) { logger.logError("Missing field [heroName]."); callback("Missing field [heroName].", null); return; }
		//AWS.config.update({region: 'eu-central-1'});
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		logger.logInfo("Calling HeroDAO.load() via statement...");
		
		ddb.query(
			{
				TableName: appContext.HERO_TABLE_NAME,
				KeyConditionExpression: "userGuid = :userGuid and heroName = :heroName", // "userGuid = :userGuid and heroName = :heroName",
				ExpressionAttributeValues: {
					":userGuid": {S: userGuid},
					":heroName": {S: heroName},            
				}
			},
			(err, heroData) => {
				if(err) { callback(err, null); return; }
				logger.logInfo("Got these data via statement:");
				logger.logInfo(JSON.stringify(heroData));
				var heroItem = AWS.DynamoDB.Converter.unmarshall(heroData.Items[0]); // Seems only new fields are in Dynamo format
				logger.logInfo("Hero [" + userGuid + "#" + heroName + "] loaded!");
				logger.logInfo("Hero JSON [" + JSON.stringify(heroItem) + "] loaded!");
				hero = new HeroDTO(heroItem);
				callback(null, hero);
			}
		);
	};	
	
	this.save = function(hero) {
		logger.logInfo("HeroDao.save");

		if(hero && hero.heroId) {
			var fs = require("fs");
			var fileName = "./data/heroes/" + hero.heroId + '.hero.json';
			
			var updateTime = new Date();
			fs.writeFile(fileName, JSON.stringify(hero),  function(err) {
				if (err) {
					return console.error(err);
				}
				logger.logInfo("Data written successfully!");
			});
		}
		else
			logger.error("Skipping save of hero as the hero in invalid!");
	};

	this.getAll = function(userGuid, callback) {
		logger.logInfo("HeroDao.getAll()");
		//var missingFields = new FV.FieldVerifier().Verify({userGuid:userGuid}, ["userGuid"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
		if(!userGuid) { logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		//AWS.config.update({region: 'eu-central-1'});
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		logger.logInfo("Calling HeroDAO.getAll() via query...");
		
		// https://docs.amazonaws.cn/en_us/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.html
		// https://www.fernandomc.com/posts/eight-examples-of-fetching-data-from-dynamodb-with-node/
		ddb.query({
			TableName: appContext.HERO_TABLE_NAME,
			KeyConditionExpression: "userGuid = :userGuid",
			ExpressionAttributeValues: {
				":userGuid": {S: userGuid}
			}
		},
		(err, heroData) => {
			if(err) { callback(err, null); return; }
			logger.logInfo("Got these data via query:");
			logger.logInfo(JSON.stringify(heroData));
			callback(null, heroData);
		})
	}	
	
	this.construct = function() {
		logger.logInfo("HeroDao.construct");
  	};
  
  _this.construct();
}

module.exports = new HeroDao();