var Logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var FV = require('../common/field-verifier.js');
var HeroDTO = require('./HeroDTO.js');
var AWS = require("aws-sdk");
var CONSTS = require('../common/Constants.js');

function HeroDAO() {
	var _this = this;
	var bucketName = appContext.PREFIX+"hero-s3";
	this.s3 = new AWS.S3();
	if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
	
	this.exists = function(fileName, callback) {
		Logger.logInfo("HeroDAO.exists");
		_this.s3.listObjectsV2(
			{
				Bucket: bucketName,
				Prefix: fileName
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
			_this.s3.listObjectsV2(
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

	this.saveAsync = async function(userGuid, heroDTO) {
		Logger.logInfo("HeroDao.saveAsync()");
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); throw new Error("Missing field [userGuid].", null); }
		var missingFields = new FV.FieldVerifier().Verify(heroDTO, ["heroName","heroClass"]); if(missingFields.length > 0) { throw new Error("Missing fields:" + JSON.stringify(missingFields)); }
		var newHeroData = saveToDBAsync(userGuid, heroDTO);
		saveDetailsAsync(heroKey, heroDTO);
		Logger.logInfo("Hero created");
		Logger.logInfo("newHeroData JSON [" + JSON.stringify(newHeroData) + "] created!");
		var newHeroItem = AWS.DynamoDB.Converter.unmarshall(newHeroData); // Seems only new fields are in Dynamo format
		var heroDTO = new HeroDTO(newHeroItem);
		return heroDTO;
	}	
	
	var saveToDBAsync = async function(userGuid, heroDTO) {
		Logger.logInfo("HeroDao.saveToDBAsync()");
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); throw new Error("Missing field [userGuid]."); }
		var missingFields = new FV.FieldVerifier().Verify(heroDTO, ["heroName","heroClass"]); if(missingFields.length > 0) { throw new Error("Missing fields:" + JSON.stringify(missingFields)); }
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		var params = {
			TableName: appContext.HERO_TABLE_NAME,
			Item: {
			  'userGuid': {S: userGuid},
			  'heroName': {S: heroDTO.heroName},
			  'heroClass': {S: heroDTO.heroClass},
			  'gender': {S: heroDTO.gender}
			},
			ReturnConsumedCapacity: "TOTAL", 
			//ProjectionExpression: 'ATTRIBUTE_NAME'
		};    
		return new Promise((resolve, reject) => {
			ddb.putItem(params, function(err, newHeroData) {
				if (err) { Logger.logInfo(err); reject(err); return; }
				else {       
					var newHeroItem = AWS.DynamoDB.Converter.unmarshall(newHeroData); // Seems only new fields are in Dynamo format
					var heroDTO = new HeroDTO(newHeroItem);
					resolve(heroDTO);
				}
			});   
		}); 
	}	

	this.save = function(userGuid, heroDTO, callback) {
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		var missingFields = new FV.FieldVerifier().Verify(heroDTO, ["heroName","heroClass"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return; }
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		var params = {
			TableName: appContext.HERO_TABLE_NAME,
			Item: {
			  'userGuid': {S: userGuid},
			  'heroName': {S: heroDTO.heroName},
			  'heroClass': {S: heroDTO.heroClass},
			  'gender': {S: heroDTO.gender}
			},
			ReturnConsumedCapacity: "TOTAL", 
			//ProjectionExpression: 'ATTRIBUTE_NAME'
		};    
		ddb.putItem(params, function(err, newHeroData) {
			if (err) { Logger.logInfo(err); callback(err, null); }
			else {       
				var heroKey = userGuid+"#"+heroDTO.heroName;
				_this.saveDetails(heroKey, heroDTO, (err, data) => {
					if (err) { Logger.logInfo(err); callback(err, null); return; }
					Logger.logInfo("Hero created");
					Logger.logInfo("newHeroData JSON [" + JSON.stringify(newHeroData) + "] created!");
					var newHeroItem = AWS.DynamoDB.Converter.unmarshall(newHeroData); // Seems only new fields are in Dynamo format
					var heroDTO = new HeroDTO(newHeroItem);
					callback(null, heroDTO);
				});
			}
		});    
	}	
	
	this.get = function(userGuid, heroName, callback) {
		Logger.logInfo("HeroDao.get()");
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		if(!heroName) { Logger.logError("Missing field [heroName]."); callback("Missing field [heroName].", null); return; }
		//AWS.config.update({region: 'eu-central-1'});
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		Logger.logInfo("Calling HeroDAO.get() via statement...");
		
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
				Logger.logInfo("Got these data via statement:");
				Logger.logInfo(JSON.stringify(heroData));
				var heroItem = AWS.DynamoDB.Converter.unmarshall(heroData.Items[0]); // Seems only new fields are in Dynamo format
				Logger.logInfo("Hero [" + userGuid + "#" + heroName + "] loaded!");
				var heroKey = userGuid+"#"+heroName;
				_this.loadDetails(heroKey, (err, heroDTO) => {
					if (err) { Logger.logInfo(err); callback(err, null); return; }
					//if(!jsonData) { callback("No json data found for hero."); return; }
					//heroDTO = new HeroDTO(JSON.parse(jsonData));
					//heroDTO.isInBattle = heroItem.isInBattle; // IMPORTANT
					Logger.logInfo("HeroDTO:");
					Logger.logInfo(JSON.stringify(heroDTO));
					callback(null, heroDTO);
				});
			}
		);
	};

	var getFromDBAsync = async function(userGuid, heroName) {
		Logger.logInfo("HeroDao.getFromDBAsync()");
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		if(!heroName) { Logger.logError("Missing field [heroName]."); callback("Missing field [heroName].", null); return; }
		//AWS.config.update({region: 'eu-central-1'});
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		Logger.logInfo("Calling HeroDAO.get() via statement...");
		
		return new Promise((resolve, reject) => {
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
					if(err) reject(err);
					Logger.logInfo("Got these data via statement:");
					Logger.logInfo(JSON.stringify(heroData));
					var heroItem = AWS.DynamoDB.Converter.unmarshall(heroData.Items[0]); // Seems only new fields are in Dynamo format
					Logger.logInfo("Hero [" + userGuid + "#" + heroName + "] loaded from DB!");					
					resolve(heroItem);
				}
			);
		});
	};

	this.getAsync = async function(userGuid, heroName) {
		Logger.logInfo("HeroDao.getAsync()");
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		if(!heroName) { Logger.logError("Missing field [heroName]."); callback("Missing field [heroName].", null); return; }
		var heroKey = userGuid+"#"+heroName;
		//var heroItem = await _this.getFromDBAsync(userGuid, heroName);
		var heroDTO = await _this.loadDetailsAsync(heroKey);
		Logger.logInfo("HeroDTO:");
		Logger.logInfo(JSON.stringify(heroDTO));
		return heroDTO;		
	};	
	
	this.loadDetails = function(heroKey, callback) {
		Logger.logInfo("HeroDAO.load");
		var fileName = "hero-" + heroKey + ".json";
		this.exists(fileName, (err, exists)=> {
			if (err) { callback(err, false); return; }
			if (!exists) { callback("Hero details file [" + fileName + "] does not exist!", null); return; }
			var params = {
				Bucket: bucketName, 
				Key: fileName
			};

			_this.s3.getObject(params, function(err, s3Object) {
				if (err) { Logger.logError(err, err.stack); callback(err, null); return; }								
				Logger.logInfo("HeroJson=" + JSON.stringify(s3Object.Body.toString()));
				var heroDTO = JSON.parse(s3Object.Body.toString());
				callback(null, heroDTO);
			});		
		});
	};

	this.loadDetailsAsync = async function(heroKey) {
		Logger.logInfo("HeroDAO.load");
		var fileName = "hero-" + heroKey + ".json";
		var exists = this.existsAsync(fileName);
		if (!exists) throw new Error("Hero details file [" + fileName + "] does not exist!", null);

		var params = {
			Bucket: bucketName, 
			Key: fileName
		};
		return new Promise((resolve, reject) => {
			_this.s3.getObject(params, function(err, s3Object) {
				if (err) { Logger.logError(err, err.stack); reject(err); }
				Logger.logInfo("HeroJson=" + JSON.stringify(s3Object.Body.toString()));
				var heroDTO = JSON.parse(s3Object.Body.toString());
				resolve(heroDTO);
			});		
		});
	};	

	var patchHero = function(heroDTO) {
		Logger.logInfo("HeroDAO.patchHero");
		if(!heroDTO.gender) { Logger.logInfo("Patching gender..."); heroDTO.gender = CONSTS.GENDERS.FEMALE; }
		return heroDTO;
	};

	var saveDetailsAsync = async function(heroKey, heroDTO) {
		Logger.logInfo("HeroDAO.saveDetailsAsync");
		if(heroDTO) {
			var fileName = "hero-" + heroKey + ".json";
			patchHero(heroDTO);			
			Logger.logInfo("Hero after patching=["+JSON.stringify(heroDTO)+"]");
			//var exists = this.existsAsync(fileName);
			//if (!exists) { callback("Hero details file [" + fileName + "] does not exist!", null); return; }			
			var params = {
				Body: JSON.stringify(heroDTO),
				Bucket: bucketName, 
				Key: fileName
			};
			return new Promise((resolve, reject) => {
				_this.s3.putObject(params, function(err, data) {
					if (err) { Logger.logError("save:"+err, err.stack); reject(err); return; }
					Logger.logInfo(data);
					resolve(true);
				});
			});
		}
		else
			Logger.error("hero was null, not saving!");
	};	
	
	this.saveDetails = function(heroKey, heroDTO, callback) {
		Logger.logInfo("HeroDAO.save");
		if(!callback) { Logger.logWarn("HeroDAO.save called with undefined callback!"); return; }
		if(heroDTO) {
			var fileName = "hero-" + heroKey + ".json";
			patchHero(heroDTO);			
			Logger.logInfo("Hero after patching=["+JSON.stringify(heroDTO)+"]");
			this.exists(fileName, (err, exists)=> {
				if (err) { Logger.logError("load:"+err, err.stack); callback(err, false); return; }
				//if (!exists) { callback("Hero details file [" + fileName + "] does not exist!", null); return; }
				var params = {
					Body: JSON.stringify(heroDTO),
					Bucket: bucketName, 
					Key: fileName
				};
				Logger.logInfo("HeroDAO.saveDetails(1)");			
				_this.s3.putObject(params, function(err, data) {
					if (err) { Logger.logError("save:"+err, err.stack); callback(err, null); return; }
					Logger.logInfo("HeroDAO.saveDetails(2)");
					Logger.logInfo(data);
					callback(null, true);
				});
				var updateTime = new Date();
			});
		}
		else
			Logger.error("hero was null, not saving!");
	};

	/*this.updateBattleStatus = function(userGuid, heroName, isInBattle, callback) {
		Logger.logInfo("HeroDAO.updateBattleStatus()");
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		if(!heroName) { Logger.logError("Missing field [heroName]."); callback("Missing field [heroName].", null); return; }
		if(!isInBattle) { Logger.logError("Missing field [isInBattle]."); callback("Missing field [isInBattle].", null); return; }
		var docClient = new AWS.DynamoDB.DocumentClient();
		
		var params = {
			TableName:appContext.HERO_TABLE_NAME,
			Key:{
				"userGuid": userGuid,
				"heroName": heroName
			},
			UpdateExpression: "set isInBattle = :isInBattle",
			ExpressionAttributeValues:{
				":isInBattle":isInBattle
			},
			ReturnValues:"ALL_NEW"
		};
	
		docClient.update(params, (err, updatedTableItem) => {
			if(err) { callback(err, null); return; }
			//var updatedHero = AWS.DynamoDB.Converter.unmarshall(updatedTableItem.Attributes); // Seems only new fields are in Dynamo format
			//heroDTO.activeHero = updatedHero.activeHero;
			//callback(null, heroDTO);
			callback(null, {});
		})
	}	*/

	this.getAll = function(userGuid, callback) {
		Logger.logInfo("HeroDao.getAll()");
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		//AWS.config.update({region: 'eu-central-1'});
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		Logger.logInfo("Calling HeroDAO.getAll() via query...");
		
		// https://docs.amazonaws.cn/en_us/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.html
		// https://www.fernandomc.com/posts/eight-examples-of-fetching-data-from-dynamodb-with-node/
		ddb.query({
			TableName: appContext.HERO_TABLE_NAME,
			KeyConditionExpression: "userGuid = :userGuid",
			ExpressionAttributeValues: {
				":userGuid": {S: userGuid}
			}
		},
		(err, heroItemsDDB) => {
			if(err) { callback(err, null); return; }
			Logger.logInfo("Got these heroes:");			
			var heroItems = [];
			for(var i=0;i<heroItemsDDB.Items.length;i++) {
				var heroItem = AWS.DynamoDB.Converter.unmarshall(heroItemsDDB.Items[i]); 
				heroItems.push(new HeroDTO(heroItem));
			}
			Logger.logInfo("heroItems="+JSON.stringify(heroItems));
			callback(null, heroItems);
		})
	}	
	
	this.construct = function() {
		Logger.logInfo("HeroDao.construct");
  	};
  
  _this.construct();
}

module.exports = new HeroDAO();


function getHeroes33(requestInput, callback) {
    /*var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    console.log("Calling getHeroes via query...");
    
    // https://docs.amazonaws.cn/en_us/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.html
    // https://www.fernandomc.com/posts/eight-examples-of-fetching-data-from-dynamodb-with-node/
    ddb.query({
        TableName: HERO_TABLE_NAME,
        KeyConditionExpression: "userGuid = :userGuid", // "userGuid = :userGuid and heroName = :heroName",
        ExpressionAttributeValues: {
            ":userGuid": {S: requestInput.userGuid}
        }
    },
    (err, heroData) => {
        if(err) { callback(err, null); return; }
        console.log("Got these data via query:");
        console.log(JSON.stringify(heroData));
        callback(null, heroData);
    })*/
}

function getHero33(requestInput, callback) {
    /*var missingFields = new FV.FieldVerifier().Verify(requestInput, ["userGuid","hero.heroName"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return }
    //AWS.config.update({region: 'eu-central-1'});
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    console.log("Calling getHero via statement...");
    
    // https://docs.amazonaws.cn/en_us/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.html
    // https://www.fernandomc.com/posts/eight-examples-of-fetching-data-from-dynamodb-with-node/
    ddb.query({
        TableName: HERO_TABLE_NAME,
        KeyConditionExpression: "userGuid = :userGuid and heroName = :heroName", // "userGuid = :userGuid and heroName = :heroName",
        ExpressionAttributeValues: {
            ":userGuid": {S: requestInput.userGuid},
            ":heroName": {S: requestInput.hero.heroName},            
        }
    },
    (err, heroData) => {
        if(err) { callback(err, null); return; }
        console.log("Got these data via statement:");
        console.log(JSON.stringify(heroData));
        callback(null, heroData);
    })*/
    

    /*ddb.executeStatement({
        Statement: "select * from om-hq-hero where userGuid=:userGuid order by heroName",
        Parameters: [{S: requestInput.userGuid }]        
    }, 
    (err, data) => {
        if(err) { callback(err, null); return; }
        console.log("Got these data via statement:");
        console.log(JSON.stringify(data));
        callback(null, data);
    });*/
    
    /*var params = {
        TableName: HERO_TABLE_NAME,
        Key: {
            "userGuid": {S: requestInput.userGuid}
            //"heroName": {S: requestInput.hero.heroName}
        },
      //ProjectionExpression: 'ATTRIBUTE_NAME'
    };
  
    var existingHero = {};
    ddb.getItem(params, function(err, heroes) {
        if (err) { console.error(err); callback(err, null); }
        else {
            if(heroes != null) {
                console.log("heroes="+JSON.stringify(heroes));
                if(heroes == typeof(Array)) {
                    heroes.forEach(hero => {
                        if(hero.item != null && hero.item.heroName == requestInput.hero.heroName) existingHero = hero.item;                
                    });
                }
            }
            callback(null, existingHero);
        }
    });*/
}