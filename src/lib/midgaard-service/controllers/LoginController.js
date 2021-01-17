var _logger = require('../common/Logger.js');
var _loginDao = require('../login/LoginDao.js');
var _baseController = require('./BaseController.js');
//var _baseController = new BaseController();
var GameSession = require('../common/GameSession.js');


module.exports = 
function LoginController() {
    var _this = this;    

    this.CreateLogin = function(postData) {
        _logger.logInfo("LoginController.Login called!");
        _logger.logInfo("creating login for [" + postData + "].....");
        var loginRequest = JSON.parse(postData);

        if (loginRequest && loginRequest.name && loginRequest.name.length > 5) {
            if (loginRequest.password == loginRequest.repeatedPassword) {
                _loginDao.save(loginRequest);
                return _baseController.JsonResult(200, { "status": "success"});
            }
            else {
                return _baseController.JsonResult(500,{ "reason": "Password and repeated password do not match!"});
            }
        }
        else {
            return _baseController.JsonResult(500,{ "reason": "Login is too short, please use at least 5 characters!"});
        }
    };

    this.Login = function(postData) {
        _logger.logInfo("Logging in [" + postData + "].....");
        var clientLogin = JSON.parse(postData);

        if (_loginDao.exists(clientLogin.name)) {
            var serverLogin = _loginDao.load(clientLogin.name);

            if (serverLogin) {
                if (serverLogin.name == clientLogin.name && serverLogin.password == clientLogin.password) {                    
                    var gameSession = new GameSession(serverLogin.name);
                    gameSession.data = serverLogin;
                    serverLogin.activeHero = null;
                    _logger.logInfo("publicKey=[" + gameSession.publicKey + "]");
                    _loginDao.Cache[gameSession.publicKey] = serverLogin;
                    return _baseController.JsonResult(200, gameSession);
                }
                else {
                    return _baseController.JsonResult(500,{ "reason": "Wrong login or password!"});
                }
            }
        }
        else {
            return _baseController.JsonResult(500,{ "reason": "login does not exist!"});
        }
    };
}