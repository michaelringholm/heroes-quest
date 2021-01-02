var mapView = {};
$(function() {	
    mapView = new MapView();
	$("#btnMove").click(function() {mapView.move();});
	$("#btnEnterTown").click(function() {townView.enterTown();});
});

function MapView() {
    var _this = this;
    var pixelMultiplier = 32;

    var move = function(direction) {
        if(!direction)
            gameSession.direction = $("#direction").val();
        else
            gameSession.direction = direction;
        
        post("Map", "Move", gameSession, moveSuccess, moveFailed);
    };
    
    var moveSuccess = function(data) {
        logInfo("move hero OK!");
        logInfo(JSON.stringify(data));
        
        if(data) {
            if(data.terrainType) { // The move resulted in an actual move
                var location = data;
                var targetCoordinates = location.targetCoordinates;			
                drawHeroMapIcon(canvasLayer2, targetCoordinates.x, targetCoordinates.y);
                logInfo("you moved to a new location");
            }
            else if(data.hero && data.mob) { // The move resulted in a fight
                var battle = data;                
                battleView.startOrResumeBattle(battle);
                logInfo("you were surprised by monsters!");
            }
        }
    };
    
    var moveFailed = function(errorMsg) {
        logInfo(errorMsg);
    };    

    this.drawMap = function(data) {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer1).show();
        $(canvasLayer2).show();
        $("#mapBottomToolbar").show();
        
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
        logInfo("drawHeroMapIcon called!");
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
            logInfo("Invalid move direction!");
    };     
}