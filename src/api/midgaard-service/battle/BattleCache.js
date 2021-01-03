var _logger = require('../common/Logger.js');
var _battleDao = require('../battle/BattleDao.js');

function BattleCache() {
    var _this = this;

    this.construct = function() {
        var battles =_battleDao.load();
        for(var battleIndex in battles)
            _this[battleIndex] = battles[battleIndex];
    };

    _this.construct();
};

module.exports = new BattleCache();