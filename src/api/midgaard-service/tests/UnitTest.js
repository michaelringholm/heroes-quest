var Logger = require('../common/Logger.js');
var Router = require('../common/Router.js');
var SmithyController = require('../controllers/SmithyController.js');

var _logger = new Logger();
var _router = new Router();


var data = { item1: "test1", item2: "test2"};
eval("new SmithyController()")["BuyItem"](data);


_router.routeOld("Smithy", "BuyItem", data);
_router.route("/Smithy/BuyItem", data);
