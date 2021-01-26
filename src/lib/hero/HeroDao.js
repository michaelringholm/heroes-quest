var _logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var FV = require('../common/field-verifier.js');
var HeroDTO = require('./HeroDTO.js');
var AWS = require("aws-sdk");

function HeroDao() {
	var _this = this;
	if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
	
	this.exists = function(heroId) {
		_logger.logInfo("HeroDao.exists");
		var fs = require("fs");
		var fileName = "./data/heroes/" + heroId + '.hero.json';
			
		var fileFound = true;
		try {
			fs.statSync(fileName);
			_logger.logInfo("File [" + fileName + "] exists!");
		}
		catch(e) {
			fileFound = false;
			_logger.logWarn("File [" + fileName + "] does not exist!");
		}
		return fileFound;
	};
	
	this.load = function(heroId) {
		_logger.logInfo("HeroDao.load");
		var fs = require("fs");
		var fileName = "./data/heroes/" + heroId + '.hero.json';
		var hero = null;
		
		var heroJson = fs.readFileSync(fileName).toString();
		_logger.logInfo("Hero [" + heroId + "] loaded!");
		_logger.logInfo("Hero JSON [" + heroJson + "] loaded!");
		
		hero = new HeroDTO(JSON.parse(heroJson));
		return hero;
	};	
	
	this.save = function(hero) {
		_logger.logInfo("HeroDao.save");

		if(hero && hero.heroId) {
			var fs = require("fs");
			var fileName = "./data/heroes/" + hero.heroId + '.hero.json';
			
			var updateTime = new Date();
			fs.writeFile(fileName, JSON.stringify(hero),  function(err) {
				if (err) {
					return console.error(err);
				}
				console.log("Data written successfully!");
			});
		}
		else
			_logger.error("Skipping save of hero as the hero in invalid!");
	};

	this.updateBattleStatus = function(requestInput, inBattle, callback) {
		var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return; }
		var docClient = new AWS.DynamoDB.DocumentClient();
		
		var params = {
			TableName:appContext.LOGIN_TABLE_NAME,
			Key:{
				"userName": requestInput.userName // TODO check access token match
			},
			UpdateExpression: "set inBattle = :inBattle",
			ExpressionAttributeValues:{
				":inBattle":inBattle
			},
			ReturnValues:"ALL_NEW"
		};
	
		docClient.update(params, (err, updatedTableItem) => {
			if(err) { callback(err, null); return; }
			//var updatedHero = AWS.DynamoDB.Converter.unmarshall(updatedTableItem.Attributes); // Seems only new fields are in Dynamo format
			//heroDTO.activeHero = updatedHero.activeHero;
			callback(null, {});
		})
	};
	
	this.construct = function() {
		_logger.logInfo("HeroDao.construct");
  	};
  
  _this.construct();
}

module.exports = new HeroDao();