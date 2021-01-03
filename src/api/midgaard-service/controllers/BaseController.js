var _logger = require('../common/Logger.js');

function BaseController() {
    var _this = this;    

    _logger.logInfo("BaseController() constructor called!");

    this.JsonResult = function(httpStatusCode, jsonData) {
        return {httpStatusCode:httpStatusCode, jsonData:jsonData};
    }
}

// Create a singleton by newing the BaseController as part of the export
module.exports = new BaseController();