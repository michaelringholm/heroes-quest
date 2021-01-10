var heroView = {};
$(function() {
    heroView = new HeroView();	
    $("#btnCreateHero").click(function() {heroView.createHero(); });    
});

function HeroView() {
    var _this = this;
    this.HeroClassEnum = { WARRIOR:"WARRIOR",PRIEST:"PRIEST",ROGUE:"ROGUE" };
    this.CREATE_HERO_URL = "https://ploifxhybi.execute-api.eu-north-1.amazonaws.com/create-hero-fn";
    this.CHOOSE_HERO_URL = "https://ploifxhybi.execute-api.eu-north-1.amazonaws.com/create-hero-fn";

    this.chooseHero = function(heroCard) {
        logDebug("chooseHero called.");
        loginView.stopWelcomeMusic();
        soundPlayer.playSound("./resources/sounds/select-hero.wav");
        var heroName = $(heroCard).attr("data-hero-name");
        
        if (heroName) {
            gameSession.heroName = heroName;
            post(CHOOSE_HERO_URL, gameSession, this.chooseHeroSuccess, this.chooseHeroFailed);
        }	
    };

    this.getHeroCardImage = function(heroClass) {
        var imgSrc = "";
        switch(heroClass) {
            case _this.HeroClassEnum.PRIEST : imgSrc = "./resources/images/characters/card-priest-male.png"; break;
            case _this.HeroClassEnum.WARRIOR : imgSrc = $("#warriorHeroImg").attr("src"); break;
            case _this.HeroClassEnum.ROGUE : imgSrc = $("#rogueHeroImg").attr("src"); break;
            default : imgSrc = $("#warriorHeroImg").attr("src");
        }
        return imgSrc;
    };    
    
    this.chooseHeroSuccess = function(data) {
        logDebug("choose hero OK!");
        if(data) {
            printDebug(data.hero);
            if(data.battle && data.battle.mob && data.battle.hero) { // The hero is already in a fight
                battleView.startOrResumeBattle(data.battle);
                logDebug("you resume the battle!");
            }		
            else if(data.town)
                townView.drawTown(data.town);
            else
                mapView.drawMap(data);
        }
        logDebug(JSON.stringify(data));
    };
    
    this.chooseHeroFailed = function(errorMsg) {
        logDebug(errorMsg);
    };
        
    this.createHero = function() {
        soundPlayer.playSound("./resources/sounds/create-hero.wav");
        var heroClass = _this.HeroClassEnum.WARRIOR; // TODO
        var data = { userGuid: gameSession.getUserGuid(), accessToken: gameSession.getAccessToken(), hero: {
            heroName: $("#newHeroName").val(), heroClass: heroClass 
        }};
        post(_this.CREATE_HERO_URL, data, createHeroSuccess, createHeroFailed);
    };
    
    var createHeroSuccess = function(data) {
        logInfo("create hero OK!");
        logInfo(JSON.stringify(data));
        var hero = data;
        $("#heroList").append('<option value="' + hero.name + '">' + hero.name + '</option>');
    };
    
    var createHeroFailed = function(errorMsg) {
        logInfo(errorMsg);
    };

    this.drawCreateHeroScreen = function() {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        $("#createHeroContainer").show();
        
        $("#container").css("background-image", "url('./resources/images/login-background.jpg')"); 
    };    
}