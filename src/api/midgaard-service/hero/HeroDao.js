var _logger = require('../common/Logger.js');
var HeroDTO = require('../hero/HeroDTO.js');

function HeroDao() {
	var _this = this;
		
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
	
	this.construct = function() {
		_logger.logInfo("HeroDao.construct");
  	};
  
  _this.construct();
}

module.exports = new HeroDao();