var battleView = {};
$(function() {	
    battleView = new BattleView();
    $("#battleBottomToolbar .commandButton.active").click(function(e) {battleView.nextRound(e.currentTarget);});
    $("#btnAcceptFate").click(function() {battleView.acceptFate();});
    $("#btnLootCorpse").click(function() {battleView.lootCorpse();});
});

function BattleView() {
    var _this = this;
    this.PLAY_ROUND_URL = "https://xirsfgg6tb.execute-api.eu-north-1.amazonaws.com/play-round-fn";
    this.ACCEPT_FATE_URL = "https://emdvapjab0.execute-api.eu-north-1.amazonaws.com/accept-fate-fn";
    this.LOOT_CORPSE_URL = "https://jodtwtw9r1.execute-api.eu-north-1.amazonaws.com/loot-corpse-fn";
    //var heroView = new HeroView();
    var deathCard = "./resources/images/battle/card-dead.png";

    /*this.handleEvent = function(commandButton) {
        var townAction = $(commandButton).attr("data-ability");
        next
    };*/
    
    this.nextRound  = function(commandButton) {        
        logDebug("next round");
        //$("#battleButtonBar").hide();
        if(!$(commandButton).hasClass("active")) return;
        gameSession.disableToolbarCommands();
        gameSession.ability = null;
        var ability = $(commandButton).attr("data-ability");
        if(ability) {
            $(commandButton).effect("pulsate", 2000);        
            //gameSession.ability = ability;
            gameSession.battleAction = ability;
            gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        }
        post(_this.PLAY_ROUND_URL, gameSession, nextRoundSuccess, nextRoundFailed);
    };
    
    var nextRoundSuccess = function(response) {
        logDebug("next round OK!");
        
        if(response.data) {
            if(response.data.battle && (!response.data.battle.status.fateAccepted || !response.data.battle.status.corpseLooted)) {
                var battle = response.data.battle;
                var hero = response.data.hero;
                drawBattleScreen(battle);			
            }
            else {
                logDebug("Battle was already over!");
                mapView.drawMap(response);
            }
        }
        gameSession.enableToolbarCommands();
    };
    
    var nextRoundFailed = function(errorMsg) {
        logDebug(errorMsg);
        gameSession.enableToolbarCommands();
    };

    this.acceptFate  = function() {        
        logDebug("acceptFate()");
        gameSession.disableToolbarCommands();
        gameSession.ability = null;
        $("#btnAcceptFate").effect("pulsate", 2000);        
        gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.ACCEPT_FATE_URL, gameSession, acceptFateSuccess, acceptFateFailed);
    };
    
    var acceptFateSuccess = function(response) {
        logDebug("acceptFate() success!");
        gameSession.enableToolbarCommands();
        townView.enterTown();        
    };
    
    var acceptFateFailed = function(errorMsg) {
        logError("acceptFate() failed!");
        logError(errorMsg);
        gameSession.enableToolbarCommands();
    };    

    this.lootCorpse  = function() {        
        logDebug("lootCorpse()");
        gameSession.disableToolbarCommands();
        gameSession.ability = null;
        $("#btnLootCorpse").effect("pulsate", 2000);        
        gameSession.accessToken = gameSession.getAccessToken(); gameSession.userName = gameSession.getUserName();
        post(_this.LOOT_CORPSE_URL, gameSession, lootCorpseSuccess, lootCorpseFailed);
    };
    
    var lootCorpseSuccess = function(response) {
        logDebug("lootCorpse() success!");
        gameSession.enableToolbarCommands();
        mapView.drawMap(response);
    };
    
    var lootCorpseFailed = function(errorMsg) {
        logError("lootCorpse() failed!");
        logError(errorMsg);
        gameSession.enableToolbarCommands();
    };    

    this.startOrResumeBattle = function(battle) {
        soundPlayer.playSound("./resources/sounds/danger.wav");
        drawBattleScreen(battle);
    };

    var updateHpEffectCallback = function() {
        $(this).hide().fadeIn();
    };

    var setHp = function(placeholder, hp, baseHp) {
        $(placeholder).html(hp + " (" + baseHp + ") HP");
        $(placeholder).effect("bounce", {}, 500, updateHpEffectCallback);
    };

    var playAbilitySound = function(ability) {
        switch(ability) {
            case "heal" : soundPlayer.playSound("./resources/sounds/heal.wav"); break;
            case "melee" : soundPlayer.playSound("./resources/sounds/sword-attack.wav"); break;
            default : soundPlayer.playSound("./resources/sounds/sword-attack.wav"); break;
        }                
    };

    var updateAbilityImpactTextEffectCallback = function() {
        $(this).hide().fadeIn();
    };

    var updateAbilityImpactText = function(name, ability, abilityImpact, placeholder) {
        var abilityText = "";
        switch(ability) {
            case "heal" : abilityText="heals for"; break;
            case "melee" : abilityText="hits for"; break;
            default : abilityText="does not know what to do"; break;
        }
        $(placeholder).html(name + " " + abilityText + " " + abilityImpact);
        $(placeholder).effect("explode", {}, 500, updateAbilityImpactTextEffectCallback);
    };

    var updateAbilityImpacts = function(battle) {
        updateAbilityImpactText(battle.hero.heroName, battle.hero.currentBattleAction, battle.hero.abilityImpact, "#heroStatus");
        updateAbilityImpactText(battle.mob.name, battle.mob.currentBattleAction, battle.mob.abilityImpact, "#mobStatus");

        // https://www.wowhead.com/spell-sounds/name:heal
        playAbilitySound(battle.hero.currentBattleAction);
        playAbilitySound(battle.mob.currentBattleAction);
        
        if(battle.hero.damageImpact > 0) {
            /*battleAnimation1("#mobHP", "#battleMobContainer", battle.hero.damageImpact*1, battle.mob.hp*1, function() {
                if(battle.mob.damageImpact > 0) {
                    battleAnimation1("#heroHP", "#battleHeroContainer", battle.mob.damageImpact*1, battle.hero.hp*1, function() {
                        $("#battleButtonBar").show();
                    });
                }
            });*/
        }
        else if(battle.mob.damageImpact > 0) {
            /*battleAnimation1("#heroHP", "#battleHeroContainer", battle.mob.damageImpact*1, battle.hero.hp*1, function() {
                $("#battleButtonBar").show();
            });*/
        }
        else
            $("#battleButtonBar").show();
    };

    var battleOver = function(battle) {
        logDebug("battle over");
        if(battle.status.winner.heroId == battle.hero.heroId) {
            logDebug("hero won");
            $("#battleMobContainer").attr("src", deathCard);
            setHp("#heroHP", battle.hero.hp, battle.hero.baseHp);
            setHp("#mobHP", battle.mob.hp, battle.mob.baseHp);
            soundPlayer.playSound("./resources/sounds/victory.wav");
            setTimeout(function() { _this.drawTreasureScreen(battle); },1500);	                
        }
        else if(battle.status.winner.mobName == battle.mob.name) {
            logDebug("mob won");
            $("#battleHeroContainer").attr("src", deathCard);
            setHp("#heroHP", battle.hero.hp, battle.hero.baseHp);
            setHp("#mobHP", battle.mob.hp, battle.mob.baseHp);
            soundPlayer.playSound("./resources/sounds/loss.wav");
            setTimeout(function() { _this.drawDeathScreen(battle.hero); },1500);
        }
        else
            logError("Winner was missing from battle!");
    };

    var getMobImgSrc = function(mob) {
        var imgSrc = null;
        imgSrc = "./resources/images/mobs/" + mob.key + ".png";
        
        if (!imgSrc) {
            logDebug("No image found for mob [" + mob.key + "]!");
            return "./resources/images/mobs/wild-boar.png";
        }
            
        return imgSrc;		
    };

    var drawBattleScreen = function(battle) {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer1).hide();
        $(canvasLayer2).hide();
        $("#battleButtonBar").hide();        
        $("#battleContainer").show()
        $("#battleBottomToolbar").show();
    
        var heroCard = $("#battleContainer .hero-card .card");
        var mobCard = $("#battleContainer .mob-card .card");
        heroCard.find(".card-img-top").attr("src", heroView.getHeroCardImage(battle.hero));
        var imgSrc = getMobImgSrc(battle.mob);
        $("#battleContainer .mob-card .card .card-img-top").attr("src", imgSrc);
        
        heroCard.find(".heroName").html(battle.hero.heroName);
        heroCard.find(".battleAction").html(battle.hero.currentBattleAction);
        heroCard.find(".abilityImpact").html("Impact=(" + battle.hero.abilityImpact + ")");
        mobCard.find(".mobName").html(battle.mob.name);
        mobCard.find(".battleAction").html(battle.mob.currentBattleAction);
        mobCard.find(".abilityImpact").html("Impact=(" + battle.mob.abilityImpact + ")");
        if(battle.round*1 == 0) {
            $("#battleContainer .abilityImpact").hide(); 
            $("#battleContainer .battleAction").hide(); 
        }
        else  {
            $("#battleContainer .abilityImpact").show(); 
            $("#battleContainer .battleAction").show(); 
        }
        if (battle.mob.name.length > 8) mobCard.find(".mobName").css("font-size", "1rem");
        else mobCard.find(".mobName").css("font-size", "1.2rem");
            
        if (battle.status.over) battleOver(battle);
        else {
            if(battle.round*1 > 0) {
                setHp("#battleContainer .hero-card .card .heroHP", battle.hero.hp, battle.hero.baseHp);
                setHp("#battleContainer .mob-card .card .mobHP", battle.mob.hp, battle.mob.baseHp);                
                updateAbilityImpacts(battle);                
            }
            else {
                setHp("#battleContainer .hero-card .card .heroHP", battle.hero.hp, battle.hero.baseHp);
                setHp("#battleContainer .mob-card .card .mobHP", battle.mob.hp, battle.mob.baseHp);
            }
        }	
    };

    this.drawTreasureScreen = function(battle) {
        logDebug("showing treasure screen!");        

        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        $("#lootText").hide();
        $("#trasureScreenTextOverlay").show();
        $("#treasureScreenButtonBar").show();
                
        $("#container").css("background-image", "url('./resources/images/loot.jpg')");
        //$("#trasureScreenTextOverlay").append("You won the battle!<br/>");                
        $("#xpEarned").html("You gained [" + battle.mob.xp + "] XP!");
        
        if(battle.mob.copper > 0)
            $("#copperLooted").html("You looted [" + battle.mob.copper + "] copper!");
        
        if(battle.mob.items && battle.mob.items.length > 0) {
            $("#lootText").show();
            var items = battle.mob.items;
            for(var itemIndex in items) {
                var item = items[itemIndex];
                var lootedItemPlaceholder = $(".template.lootedItem").clone();
                $(lootedItemPlaceholder).removeClass("template");
                $(lootedItemPlaceholder).find(".lootedItemName").html(item.name);
                $("#lootedItems").append(lootedItemPlaceholder);
                //$("#trasureScreenTextOverlay").append("Item looted: " + item.name + "<br>");
            }
        }
    };    

    this.drawTreasureScreenOld = function(battle) {
        logDebug("showing treasure screen!");
        $(".function").hide();	
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).show();
        $("#treasureScreenButtonBar").show();	
        
        var ctx1 = canvasLayer1.getContext("2d");
        ctx1.clearRect(0,0,canvasWidth,canvasHeight);
        
        $("#container").css("background-image", "url('./resources/images/loot.jpg')");
        
        ctx1.font = "3rem midgaardFont";
        ctx1.fillStyle = '#E4CA64';
        ctx1.fillText("You won the battle!",50,60);
        ctx1.fillText("You gained [" + battle.mob.xp + "] XP!",50,90);
        
        if(battle.mob.copper > 0)
            ctx1.fillText("You looted [" + battle.mob.copper + "] copper!",50,120);
        
        if(battle.mob.items && battle.mob.items.length > 0)
            ctx1.fillText("You found items while searching the corpse!",50,150);
    };
    
    this.drawDeathScreen = function(hero) {
        logDebug("showing death screen!");	        
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
    
        $("#deathScreenTextOverlay").show();
        $("#deathScreenBottomToolbar").show();		
        
        $("#container").css("background-image", "url('./resources/images/valkyrie.jpg')");
        
        $("#deathScreenTextOverlay").html("You died and lost XP and stamina!<br/>");
        $("#deathScreenTextOverlay").append("You soul will be summoned by a Valkyrie to your home town if you accept your fate!");
    };

    this.battleAnimation1 = function(targetHPDiv, targetCardDiv, damageImpact, finalHP, fnCallback) { 
        var audio = new Audio('./resources/sounds/sword-attack.wav');
        //var orgLeftPos = $(targetHPDiv).css("left");
        //$(targetHPDiv).css("left", orgLeftPos-40);
        
        $(targetHPDiv)
            .switchClass("plainText", "strikedText", 1500)
            .effect("pulsate", 2500)
            .switchClass("strikedText", "plainText", 1000)
            .effect("pulsate", function() { $(targetHPDiv).html(damageImpact + ' damage!').fadeIn(100);  audio.play(); }, 2500)
            .effect("pulsate", function() { $(targetHPDiv).html(finalHP + ' HP').fadeIn(100);}, 1500)
            .fadeIn(100, function() { $(targetCardDiv).effect("shake", 800); fnCallback(); });
    };
}