var logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var FV = require('../common/field-verifier.js');
var LoginDTO = require('./LoginDTO.js');
var AWS = require("aws-sdk");
const UUID = require('uuid');

function LoginDAO() {
	var _this = this;
	if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
	
	this.exists = function(heroId) {
		logger.logInfo("LoginDAO.exists");
		throw "Not implemented";
	};
	
	this.get = function(userName, callback) {
		logger.logInfo("LoginDAO.get()...");
		if(!userName) { logger.logError("Missing field [userName]."); callback("Missing field [userName].", null); return; }
		//AWS.config.update({region: 'eu-central-1'});
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		logger.logInfo("Calling LoginDAO.get() via statement...");
		
		ddb.query({
			TableName: appContext.LOGIN_TABLE_NAME,
			KeyConditionExpression: "userName = :userName",
			ExpressionAttributeValues: {
				":userName": {S: userName}
			}
		},
		(err, loginItems) => {
			if(err) { callback(err, null); return; }
			logger.logInfo("Got these data via statement:");
			logger.logInfo(JSON.stringify(loginItems));
			var loginDTO = AWS.DynamoDB.Converter.unmarshall(loginItems.Items[0]); // Seems only new fields are in Dynamo format
			callback(null, loginDTO);
		})
	};

	this.setActiveHeroName = function(userName, activeHeroName, callback) {
		//var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userName",]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return; }
		if(!userName) { logger.logError("Missing field [userName]."); callback("Missing field [userName].", null); return; }
		if(!activeHeroName) { logger.logError("Missing field [activeHeroName]."); callback("Missing field [activeHeroName].", null); return; }
		var docClient = new AWS.DynamoDB.DocumentClient();
		
		var params = {
			TableName:appContext.LOGIN_TABLE_NAME,
			Key:{
				"userName": userName
			},
			UpdateExpression: "set activeHeroName = :activeHeroName",
			ExpressionAttributeValues:{
				":activeHeroName":activeHeroName
			},
			ReturnValues:"ALL_NEW"
		};
	
		docClient.update(params, (err, updatedTableItem) => {
			if(err) { callback(err, null); return; }
			//hero.activeHeroName = hero.heroName;
			var updatedHero = AWS.DynamoDB.Converter.unmarshall(updatedTableItem.Attributes); // Seems only new fields are in Dynamo format
			//var hero = AWS.DynamoDB.Converter.unmarshall(hero); // Seems only new fields are in Dynamo format
			/*logger.logInfo("RETURNED FROM UPDATE STATEMENT");
			logger.logInfo(JSON.stringify(updatedTableItem));
			logger.logInfo("RETURNED FROM UNMARSHALL");
			logger.logInfo(JSON.stringify(updatedHero));*/
			hero.activeHero = updatedHero.activeHero;
			callback(null, hero);
		})
	}	

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

	this.updateToken = function(loginDTO, callback) {
		logger.logInfo("LoginDAO.updateToken()...");
		loginDTO.accessToken = UUID.v4();
		var missingFields = new FV.FieldVerifier().Verify(loginDTO, ["userGuid"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return; }
		var docClient = new AWS.DynamoDB.DocumentClient();
		
		var params = {
			TableName:appContext.LOGIN_TABLE_NAME,
			Key:{
				"userName": loginDTO.userName // TODO check access token match
			},
			UpdateExpression: "set accessToken = :accessToken",
			ExpressionAttributeValues:{
				":accessToken":loginDTO.accessToken
			},
			ReturnValues:"ALL_NEW"
		};
	
		docClient.update(params, (err, updatedTableItem) => {
			if(err) { callback(err, null); return; }
			callback(null, loginDTO);
		})
	}	
	
	this.construct = function() {
		logger.logInfo("HeroDao.construct");
  	};
  
  _this.construct();
}

module.exports = new LoginDAO();