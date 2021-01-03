var _logger = require('../common/Logger.js');
var Battle = require('../battle/Battle.js');
var BattleFactory = require('../battle/BattleFactory.js');

function BattleDao() {
	var _this = this;
		
	var exists = function() {
		_logger.logInfo("BattleDao.exists");
		var fs = require("fs");
		var fileName = "./data/battles/" + "battles" + '.json';
			
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
	
	this.load = function() {
		_logger.logInfo("BattleDao.load");
		var fs = require("fs");
		var fileName = "./data/battles/" + "battles" + '.json';
		
		if(exists()) {
			var battlesJson = fs.readFileSync(fileName).toString();
			_logger.logInfo("Battles JSON [" + battlesJson + "] loaded!");
			
			var battleDTOs = JSON.parse(battlesJson);
			/*var battlesHashMap = {};
			for(var battleDTOIndex in battleDTOs) {
				battlesHashMap[battleDTOIndex] = BattleFactory.Create(battleDTOs[battleDTOIndex]);
			}*/
			return battleDTOs;
		}
		else
			return {};
	};	
	
	this.save = function(battles) {
		_logger.logInfo("BattleDao.save");
		if(battles) {
			var fs = require("fs");
			var fileName = "./data/battles/" + "battles" + '.json';
			
			var updateTime = new Date();
			fs.writeFile(fileName, JSON.stringify(battles),  function(err) {
				if (err) {
					return console.error(err);
				}
				console.log("Data written successfully!");
			});
		}
		else
			_logger.error("Skipping save of battles as the battles hashmap in invalid!");
	};	
	
	this.construct = function() {
		_logger.logInfo("BattleDao.construct");
  };
  
  _this.construct();
}

module.exports = new BattleDao();