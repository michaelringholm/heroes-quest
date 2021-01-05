var heroView = {};
$(function() {
    heroView = new HeroView();	
    $("#btnCreateHero").click(function() {heroView.createHero(); });    
});

function HeroView() {
    var _this = this;
    this.CREATE_HERO_URL = "https://ploifxhybi.execute-api.eu-north-1.amazonaws.com/create-hero-fn";

    this.chooseHero = function(heroCard) {
        logDebug("chooseHero called.");
        loginView.stopWelcomeMusic();
        soundPlayer.playSound("./resources/sounds/select-hero.wav");
        var heroId = $(heroCard).attr("data-hero-id");
        
        if (heroId) {
            gameSession.heroId = heroId;
            post("Hero", "ChooseHero", gameSession, chooseHeroSuccess, chooseHeroFailed);
        }	
    };

    this.getHeroCardImage = function(heroClass) {
        var imgSrc = "";
        switch(heroClass) {
            case "priest" : imgSrc = "./resources/images/characters/card-priest-male.png"; break;
            case "warrior" : imgSrc = $("#warriorHeroImg").attr("src"); break;
            case "rogue" : imgSrc = $("#rogueHeroImg").attr("src"); break;
            default : imgSrc = $("#warriorHeroImg").attr("src");
        }
        return imgSrc;
    };    
    
    var chooseHeroSuccess = function(data) {
        logInfo("choose hero OK!");
        if(data) {
            printDebug(data.hero);
            if(data.battle && data.battle.mob && data.battle.hero) { // The hero is already in a fight
                battleView.startOrResumeBattle(data.battle);
                logInfo("you resume the battle!");
            }		
            else if(data.town)
                townView.drawTown(data.town);
            else
                mapView.drawMap(data);
        }
        logInfo(JSON.stringify(data));
    };
    
    var chooseHeroFailed = function(errorMsg) {
        logInfo(errorMsg);
    };
    
    const HeroClassEnum = { WARRIOR:"WARRIOR" };
    this.createHero = function() {
        soundPlayer.playSound("./resources/sounds/create-hero.wav");
        var heroClass = HeroClassEnum.WARRIOR;
        var hero = { heroName: $("#newHeroName").val(), heroClass: heroClass };
        gameSession.data = hero;
        post(_this.CREATE_HERO_URL, gameSession, createHeroSuccess, createHeroFailed);
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