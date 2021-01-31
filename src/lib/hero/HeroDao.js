var Logger = require('../common/Logger.js');
var appContext = require('../common/AppContext.js');
var FV = require('../common/field-verifier.js');
var HeroDTO = require('./HeroDTO.js');
var AWS = require("aws-sdk");

function HeroDAO() {
	var _this = this;
	if(AWS.config.region == null) AWS.config.update({region: 'eu-north-1'});
	
	this.exists = function(heroId) {
		Logger.logInfo("HeroDao.exists");
		var fs = require("fs");
		var fileName = "./data/heroes/" + heroId + '.hero.json';
			
		var fileFound = true;
		try {
			fs.statSync(fileName);
			Logger.logInfo("File [" + fileName + "] exists!");
		}
		catch(e) {
			fileFound = false;
			Logger.logWarn("File [" + fileName + "] does not exist!");
		}
		return fileFound;
	};

	this.createHero = function(userGuid, heroDTO, callback) {
		if(!userGuid) { Logger.logError("Missing field [userGuid]."); callback("Missing field [userGuid].", null); return; }
		var missingFields = new FV.FieldVerifier().Verify(heroDTO, ["heroName","heroClass"]); if(missingFields.length > 0) { callback("Missing fields:" + JSON.stringify(missingFields), null); return; }
		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		var params = {
			TableName: appContext.HERO_TABLE_NAME,
			Item: {
			  'userGuid': {S: userGuid},
			  'heroName': {S: heroDTO.heroName},
			  'heroClass': {S: heroDTO.heroClass},
			  'isInBattle': {BOOL: false},
			  'jsonData': {S: JSON.stringify(heroDTO)}
			},
			ReturnConsumedCapacity: "TOTAL", 
			//ProjectionExpression: 'ATTRIBUTE_NAME'
		};    
		ddb.putItem(params, function(err, newHeroData) {
			if (err) { Logger.logInfo(err); callback(err, null); }
			else {       
				Logger.logInfo("Hero created");
				Logger.logInfo("newHeroData JSON [" + JSON.stringify(newHeroData) + "] created!");
				var newHeroItem = AWS.DynamoDB.Converter.unmarshall(newHeroData); // Seems only new fields are in Dynamo format
				var heroDTO = new HeroDTO(newHeroItem);
				callback(null, heroDTO);
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
				if(!heroItem.jsonData) { callback("No json data found for hero."); return; }
				heroDTO = new HeroDTO(JSON.parse(heroItem.jsonData));
				Logger.logInfo("HeroDTO:");
				Logger.logInfo(JSON.stringify(heroDTO));
				callback(null, heroDTO);
			}
		);
	};	
	
	this.save = function(hero) {
		Logger.logInfo("HeroDao.save");

		if(hero && hero.heroId) {
			var fs = require("fs");
			var fileName = "./data/heroes/" + hero.heroId + '.hero.json';
			
			var updateTime = new Date();
			fs.writeFile(fileName, JSON.stringify(hero),  function(err) {
				if (err) {
					return console.error(err);
				}
				Logger.logInfo("Data written successfully!");
			});
		}
		else
			Logger.error("Skipping save of hero as the hero in invalid!");
	};

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