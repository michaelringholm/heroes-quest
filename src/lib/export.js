var Logger = require("./common/Logger.js");
const MidgaardMainMap = require('./map/MidgaardMainMap.js');
const Location = require('./map/Location.js');
const MapDictionary = require('./map/MapDictionary.js');
const MobFactory = require('./mob/MobFactory.js');
const BattleFactory = require('./battle/BattleFactory.js');
const BattleDTO = require('./battle/BattleDTO.js');

module.exports.Location = Location;
module.exports.MidgaardMainMap = MidgaardMainMap;
module.exports.Logger = Logger;
module.exports.MapDictionary = MapDictionary;
module.exports.MobFactory = MobFactory;
module.exports.BattleFactory = BattleFactory;
module.exports.BattleDTO = BattleDTO;