var mapView = {};
$(function() {	
    mapView = new MapView();
	$("#btnMove").click(function() {mapView.move();});
	$("#btnEnterTown").click(function() {townView.enterTown();});
});

function MapView() {
    var _this = this;
    var pixelMultiplier = 32;
    this.MAP_MOVE_URL = "https://55330k0b71.execute-api.eu-north-1.amazonaws.com/map-move-fn";

    var move = function(direction) {
        if(!direction) gameSession.direction = $("#direction").val();
        else gameSession.direction = direction;
        gameSession.userGuid = gameSession.getUserGuid(); gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.MAP_MOVE_URL, gameSession, moveSuccess, moveFailed);
    };
    
    var moveSuccess = function(response) {
        logDebug("move hero OK!");
        printJson(JSON.stringify(response));
        
        if(response) {
            if(response.data && response.data.newLocation && response.data.newLocation.terrainType) { // The move resulted in an actual move
                var location = response.data.newLocation;
                var targetCoordinates = location.targetCoordinates;
                drawHeroMapIcon(canvasLayer2, targetCoordinates.x, targetCoordinates.y);
                logDebug("you moved to a new location");
            }
            else if(response.data.hero && response.data.battle) { // The move resulted in a fight
                var battle = response.data.battle;                
                battleView.startOrResumeBattle(battle);
                logDebug("you were surprised by monsters!");
            }
        }
    };
    
    var moveFailed = function(errorMsg) {
        logInfo(errorMsg);
    };    

    this.drawMap = function(response) {
        logDebug("drawMap()");
        var data = response.data;
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer1).show();
        $(canvasLayer2).show();
        $("#mapBottomToolbar").show();
        
        $("#container").off("keypress");
        $("#container").keypress(function(e) { 
            if(e.which == 100 || e.which == 97 || e.which == 115 || e.which == 119) {
                e.preventDefault();
                moveHero(e.which);
            }
        });
        
        
        var ctx1 = canvasLayer1.getContext("2d");
        var ctx2 = canvasLayer2.getContext("2d");
        ctx1.clearRect(0,0,canvasWidth,canvasHeight);
        ctx2.clearRect(0,0,canvasWidth,canvasHeight);
        
        if(data) {
            var name = data.map.name;
            var mapMatrix = data.map.mapMatrix;
            var hero = data.hero;
            $("#container").css("background-image", "url('./resources/images/map-background.jpg')");
            
            for(var yIndex in mapMatrix) {
                for(var xIndex in mapMatrix[yIndex]) {
                    drawMapTile(canvasLayer1, xIndex*32,yIndex*32,mapMatrix[yIndex][xIndex]);
                }
            }		
    
            drawHeroMapIcon(canvasLayer2,hero.currentCoordinates.x,hero.currentCoordinates.y);
        }
    };
    
    var drawMapTile = function(canvas, xPos, yPos, terrainType) {
        var ctx = canvas.getContext("2d");
        var img = null;
        
        if(terrainType == "w")
            img = document.getElementById("woods");
        else if(terrainType == "m")
            img = document.getElementById("mountains");
        else if(terrainType == "h")
            img = document.getElementById("mountains");		
        else if(terrainType == "t")
            img = document.getElementById("town");
        else if(terrainType == "r")
            img = document.getElementById("road");
        else if(terrainType == "c")
            img = document.getElementById("cave");
    
        if(!img)
            logInfo("The image for terrainType [" + terrainType + "] was not found!");
        else
            ctx.drawImage(img,xPos,yPos,32,32);
    };
        
    var drawHeroMapIcon = function(canvas, xPos, yPos) {
        logDebug("drawHeroMapIcon called!");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvasWidth,canvasHeight);
        var img = document.getElementById("heroMapIcon");
        ctx.drawImage(img,xPos*pixelMultiplier,yPos*pixelMultiplier,32,32);
    };
    
    var moveHero = function(keyCode) {	
        var stepSize = 32;
        var direction = null;
        
        if(keyCode == 100) { // D which is east
            //currentHeroXPos = currentHeroXPos+stepSize;    		
            direction = "east";
        }
        if(keyCode == 119) { // W which is north
            //currentHeroYPos = currentHeroYPos-stepSize;    		
            direction = "north";
        }		
        if(keyCode == 97) { // A which is west
            //currentHeroXPos = currentHeroXPos-stepSize;    		
            direction = "west";
        }		
        if(keyCode == 115) { // S which is south
            //currentHeroYPos = currentHeroYPos+stepSize;    		        
            direction = "south";
        }		
            
        if(direction) {
            move(direction);		
        }
        else
            logDebug("Invalid move direction!");
    };     
}