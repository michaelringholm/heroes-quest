var townView = {};
$(function() {	
    townView = new TownView();
    $("#townBottomToolbar .commandButton").click(function(e) {townView.handleEvent(e.currentTarget);});
});

function TownView() {
    var _this = this;
    this.ENTER_TOWN_URL = "https://41fldyiw0d.execute-api.eu-north-1.amazonaws.com/enter-town-fn";
    this.LEAVE_TOWN_URL = "https://08jkrc95x9.execute-api.eu-north-1.amazonaws.com/leave-town-fn";
    this.TRAIN_HERO_URL = "https://lu7glqizf0.execute-api.eu-north-1.amazonaws.com/train-hero-fn";
    this.VISIT_MEADHALL_URL = "https://1lsgtu3j59.execute-api.eu-north-1.amazonaws.com/visit-meadhall-fn";
    this.VIEW_CHARACTER_URL = "https://d6ffyioj9l.execute-api.eu-north-1.amazonaws.com/view-character-fn";
    
    this.handleEvent = function(commandButton) {
        var townAction = $(commandButton).attr("data-town-action");
        switch(townAction) {
            case "VisitMeadhall": _this.visitMeadhall(); break;
            case "VisitSmithy": smithyView.enter(); break;
            case "Train": _this.train(); break;
            case "ViewCharacter": _this.viewCharacter(); break;
            case "LeaveTown": _this.leaveTown(); break;
            default: logInfo("Unknwon town action");
        }
    };

    this.enterTown = function() {
        gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.ENTER_TOWN_URL, gameSession, enterTownSuccess, enterTownFailed);
    };

    var enterTownSuccess = function(response) {
        logInfo("enter town OK!");
        logInfo(JSON.stringify(data));        
        
        if(response.data.location.town) {
            soundPlayer.playSound("./resources/sounds/enter-town.mp3");
            printDebug(response.data.hero);
            var town = response.data.location.town;
            logInfo("Entering the town of [" + town.name + "]!");
            _this.drawTown(town);
        }
        else
            logInfo("There is no town at this location, continuing on map!");
    };

    var enterTownFailed = function(errorMsg) {
        logInfo(errorMsg);
    };
    
    this.viewCharacter = function() {
        gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.VIEW_CHARACTER_URL, gameSession, _this.viewCharacterSuccess, _this.viewCharacterFailed);
    };

    this.viewCharacterSuccess = function(response) {
        logInfo("view character OK!");
        var location = response.data.location;
        logInfo(JSON.stringify(location));
        
        if(location.town) {
            var hero = response.data.hero;
            logInfo("Viewing character sheet for [" + hero + "]!");
            _this.drawCharacterSheet(hero);
        }
        else logInfo("You are not in a town, can't view character outside of town!");
    };

    this.viewCharacterFailed = function(errorMsg) {
        logInfo(errorMsg);
    };

    this.train = function() {
        gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.TRAIN_HERO_URL, gameSession, _this.trainSuccess, _this.trainFailed);
    };

    this.trainSuccess = function(data) {
        logInfo("enter town OK!");
        logInfo(JSON.stringify(data));
        
        if(data.town) {
            var town = data.town;
            logInfo("Training in the town of [" + town.name + "]!");
            _this.drawTraining(data.hero, data.trainingOutcome, data.town);
        }
        else
            logInfo("There is no town at this location, continuing on map!");
    };

    this.trainFailed = function(errorMsg) {
        logInfo(errorMsg);
    };

    this.visitMeadhall = function() {
        gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.VISIT_MEADHALL_URL, gameSession, _this.visitMeadhallSuccess, _this.visitMeadhallFailed);
    };

    this.visitMeadhallSuccess = function(data) {
        logInfo("enter town OK!");
        logInfo(JSON.stringify(data));
        
        if(data.town) {
            var town = data.town;
            logInfo("Entering the town of [" + town.name + "]!");
            _this.drawMeadhall(town, data.actionResponse);
        }
        else
            logInfo("There is no town at this location, continuing on map!");
    };

    this.visitMeadhallFailed = function(errorMsg) {
        logInfo(errorMsg);
    };

    this.leaveTown = function() {
        gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.LEAVE_TOWN_URL, gameSession, _this.leaveTownSuccess, _this.leaveTownFailed);
    };

    this.leaveTownSuccess = function(response) {
        logInfo("leave town OK!");
        logInfo(JSON.stringify(response));
        
        mapView.drawMap(response);
    };

    this.leaveTownFailed = function(errorMsg) {
        logInfo(errorMsg);
    };

    this.drawTown = function(town) {
        logDebug("drawTown()");
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer1).show();
        $(canvasLayer2).show();
        $("#townBottomToolbar").show();
        
        var ctx1 = canvasLayer1.getContext("2d");
        var ctx2 = canvasLayer2.getContext("2d");
        ctx1.clearRect(0,0,canvasWidth,canvasHeight);
        ctx2.clearRect(0,0,canvasWidth,canvasHeight);
        
        //var townImg = document.getElementById("town");		
        //ctx1.drawImage(townImg,50,50,120,190);
        
        $("#container").css("background-image", "url('./resources/images/town/town.jpg')"); 
        
        ctx1.font = "28px Calibri";
        ctx1.fillStyle = '#3D3A36';
      ctx1.fillText(town.name,50,30);
    };

    this.drawMeadhall = function(town, actionResponse) {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        $("#meadhallTextOverlay").show();
        $("#townBottomToolbar").show();
        
        $("#container").css("background-image", "url('./resources/images/meadhall-background.jpg')"); 	
        
        if(actionResponse.success) {
            $("#meadhallTextOverlay").html("You feel rested, and both body and mind feels renewed!<br/>");
            $("#meadhallTextOverlay").append("Your happily pay the head brewer what you owe him!");
        }
        else {
            $("#meadhallTextOverlay").html(actionResponse.reason + "<br/>");
        }
    };

    this.drawTraining = function(hero, trainingOutcome, town) {
        logInfo("showing training screen!");
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).show();
        $("#townBottomToolbar").show();
        
        var ctx1 = canvasLayer1.getContext("2d");
        //var ctx2 = canvasLayer2.getContext("2d");
        ctx1.clearRect(0,0,canvasWidth,canvasHeight);
        //ctx2.clearRect(0,0,canvasWidth,canvasHeight);
        
        $("#container").css("background-image", "url('./resources/images/training-background.jpg')"); 
        
        ctx1.font = "28px Calibri";
        ctx1.fillStyle = '#3D3A36';
      ctx1.fillText(town.name,50,30);
        
        ctx1.font = "20px Calibri";
        ctx1.fillStyle = '#E4CA64';
        
        if(trainingOutcome.trained) {
            ctx1.fillText("You trained hard and gained a level!. You are now level [" + hero.level + "]",70,90);
        }
        else {
            ctx1.fillText(trainingOutcome.reason,70,90);
        }
    };

    this.drawCharacterSheet = function(hero) {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        //$("#characterScreenOverlay").show();
        $("#characterScreen").show();
        $("#townBottomToolbar").show();
        
        $("#container").css("background-image", "url('./resources/images/character-sheet-background.jpg')"); 	
        $("#characterScreenOverlay").html("This is the character screen!<br/>");
        //$("#characterScreenOverlay").append("The smith has around " + smithy.copper + " copper pieces!<br/>");
        
        $(".heroName").html("Name:" + hero.heroName);
        $(".heroLevel").html("Level:" + hero.level);
        $(".heroHP").html("HP:" + hero.hp);
        $(".heroMoney").html("Copper:" + hero.copper);
            
        for(var itemIndex in hero.items) {
            var name = hero.items[itemIndex].name;
            var itemImgUrl = "./resources/images/items/StoneHatchet_Icon.png";
            
            if(name == "long sword")
                itemImgUrl = "./resources/images/items/StoneHatchet_Icon.png";
            else if(name == "wooden sword")
                itemImgUrl = "./resources/images/items/the_axe_in_the_basement.png";
            else if(name == "silver long sword")
                itemImgUrl = "./resources/images/items/128px-Wooden_Shield.png";
            else if(name == "rabbits foot")
                itemImgUrl = "./resources/images/items/rabbits-foot.png";
            else if(name == "deer skin")
                itemImgUrl = "./resources/images/items/deer-skin.png";
            else if(name == "beetle shell")
                itemImgUrl = "./resources/images/items/beetle-shell.png";				
            
            $(".characterItemContainer:eq(" + itemIndex + ")").html('<img src="' + itemImgUrl + '" alt="' + name + '" title="' + name + '" style="height: 64px; width: 64px; position: absolute; top:6px; left: 6px;" />');
            
            var value = hero.items[itemIndex].value;
            if(!hero.items[itemIndex].value) value = 0;
            $(".characterItemContainerMetaData:eq(" + itemIndex + ")").html(name + '<br>Value: ' + value + ' cp');
            
            // Maximum of 6 items
            if (itemIndex > 5) {
                break;
            }
        }
    };
    
    this.drawCharacterSheetOld = function(hero) {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).show();
        $("#townBottomToolbar").show();
        
        var ctx1 = canvasLayer1.getContext("2d");
        
        ctx1.clearRect(0,0,canvasWidth,canvasHeight);
        
        $("#container").css("background-image", "url('./resources/images/character-sheet-background.jpg')"); 
        
        ctx1.font = "18px midgaardFont";
        ctx1.fillStyle = '#e1b91a';
        
        ctx1.fillText("LEVEL:" + hero.level,540,100);
        
        ctx1.fillText("HP:" + hero.hp + " (" + hero.baseHp + ")",340,200);
        ctx1.fillText("MANA:" + hero.mana + " (" + hero.baseMana + ")",340,230);
        ctx1.fillText("AC:" + hero.ac + " (" + hero.baseAc + ")",340,260);
        ctx1.fillText("XP:" + hero.xp,340,290);
        ctx1.fillText("COPPER:" + hero.copper,340,320);
        
        ctx1.fillText("STRENGTH:" + hero.str,740,200);
        ctx1.fillText("STAMINA:" + hero.sta,740,230);
        ctx1.fillText("INTELLIGENCE:" + hero.int,740,260);
        ctx1.fillText("REGEN:" + hero.regen,740,290);
        ctx1.fillText("LUCK:" + hero.luck,740,320);	
    }; 
}