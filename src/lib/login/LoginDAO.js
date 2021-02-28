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
			logger.logInfo("loginDTO:");
			logger.logInfo(JSON.stringify(loginDTO));
			callback(null, loginDTO);
		})
	};

	this.getByToken = function(token, callback) {
		logger.logInfo("LoginDAO.getByToken()...");
		if(!token) { logger.logError("Missing field [token]."); callback("Missing field [token].", null); return; }
		var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

		var params = {
		  FilterExpression: "accessToken = :accessToken",
		  ExpressionAttributeValues: {
			":accessToken": { S: token }
		  },
		  //ProjectionExpression: "Season, Episode, Title, Subtitle",
		  TableName: appContext.LOGIN_TABLE_NAME,
		};
		
		ddb.scan(params, function (err, loginItems) {
			if(err) { callback(err, null); return; }
			logger.logInfo("loginItems=" + JSON.stringify(loginItems));
			if(loginItems.Items.length == 0) throw new Error("The access token was not found!");
			if(loginItems.Items.length > 1) throw new Error("Multiple access keys found, something is very wrong!");
			var loginDTO = AWS.DynamoDB.Converter.unmarshall(loginItems.Items[0]);
			callback(null, loginDTO);
		});
	};

	this.getByTokenAsync = async function(token) {
		logger.logInfo("LoginDAO.getByToken()...");
		if(!token) { logger.logError("Missing field [token]."); throw new Error("Missing field [token]."); }
		var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

		var params = {
		  FilterExpression: "accessToken = :accessToken",
		  ExpressionAttributeValues: {
			":accessToken": { S: token }
		  },
		  //ProjectionExpression: "Season, Episode, Title, Subtitle",
		  TableName: appContext.LOGIN_TABLE_NAME,
		};
		return new Promise((resolve, reject) => {
			ddb.scan(params, function (err, loginItems) {
				if(err) { reject(err); return; }
				logger.logInfo("loginItems=" + JSON.stringify(loginItems));
				if(loginItems.Items.length == 0) throw new Error("The access token was not found!");
				if(loginItems.Items.length > 1) throw new Error("Multiple access keys found, something is very wrong!");
				var loginDTO = AWS.DynamoDB.Converter.unmarshall(loginItems.Items[0]);
				resolve(loginDTO);
			});
		});		
	};	

	this.setActiveHeroNameAsync = async function(userName, activeHeroName) {
		if(!userName) throw new Error("Missing field [userName].");
		if(!activeHeroName) throw new Error("Missing field [activeHeroName].");
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

		return new Promise((resolve, reject) => {
			docClient.update(params, (err, updatedTableItem) => {
				if(err) { reject(err, null); return; }
				var updatedHero = AWS.DynamoDB.Converter.unmarshall(updatedTableItem.Attributes); // Seems only new fields are in Dynamo format
				resolve(updatedHero);
			})
		});
	}	

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
			//hero.activeHero = updatedHero.activeHero;
			callback(null, updatedHero);
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