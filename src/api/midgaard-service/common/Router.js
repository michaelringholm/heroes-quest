var fs = require( 'fs' );
var path = require( 'path' );
// In newer Node.js versions where process is already global this isn't necessary.
var process = require( "process" );
var _logger = require('../common/Logger.js');




//eval("var SmithyController = require('../controllers/SmithyController.js')");

module.exports = function Router() {
    var _this = this;
    this.importDone = false;

    this.route = function(fullRoute, data) {
        _logger.logInfo("Full Route=" + fullRoute);        
        var routeParts = fullRoute.split("/");
        _logger.logInfo("routeParts[1]=" + routeParts[1]);
        _logger.logInfo("routeParts[2]=" + routeParts[2]);
        if(!_this.importDone)
            _this.importControllers();
        return eval("new _this." + routeParts[1] + "Controller()")[routeParts[2]](data);  
    };

    this.importControllers = function() {
        console.log("*************  importControllers ...");
        var files = fs.readdirSync( "./controllers/");
        
        for(var fileIndex=0;fileIndex<files.length;fileIndex++) {
            var file = files[fileIndex];
            var filePath = path.join( "./controllers/", file );            
            var fileStats = fs.statSync(filePath);
            
            if(fileStats.isFile()) {
                console.log("'%s' is a file.", file );
                var controllerName = file.substring(0, file.length-3);
                console.log("Controller Name=" + controllerName);
                eval("_this." + controllerName + " = require('../controllers/" + file + "')");
                console.log( "imported module %s.", file );                            
            }
            else if(fileStats.isDirectory()) {
                console.log( "'%s' is a directory.", fromPath );
            }                    
        }            
        _this.importDone = true;
        console.log("*************  importControllers done!");       
    };
};