var heroView = {};
$(function() {
    heroView = new HeroView();	
    $("#btnCreateHero").click(function() {heroView.createHero(); });    
});

function HeroView() {
    var _this = this;
    this.HeroClassEnum = { WARRIOR:"WARRIOR",PRIEST:"PRIEST",ROGUE:"ROGUE" };
    this.CREATE_HERO_URL = "https://ploifxhybi.execute-api.eu-north-1.amazonaws.com/create-hero-fn";
    this.CHOOSE_HERO_URL = "https://i0xybknpwa.execute-api.eu-north-1.amazonaws.com/choose-hero-fn";

    this.chooseHero = function(heroCard) {
        logDebug("chooseHero called.");
        loginView.stopWelcomeMusic();
        soundPlayer.playSound("./resources/sounds/select-hero.wav");
        var heroName = $(heroCard).attr("data-hero-name");
        
        if (heroName) {
            data = { userName: gameSession.getUserName(), userGuid: gameSession.getUserGuid(), accessToken: gameSession.getAccessToken(), hero: { heroName: heroName } };
            post(_this.CHOOSE_HERO_URL, data, this.chooseHeroSuccess, this.chooseHeroFailed);
        } 
        else logError("Unable to find character name!");
    };
    
    this.getHeroCardImage = function(hero) {
        var imgSrc = "";
        if(hero.gender == "female") {
            switch(hero.heroClass) {
                case _this.HeroClassEnum.PRIEST : imgSrc = "./resources/images/characters/female-priest.jpg"; break;
                case _this.HeroClassEnum.WARRIOR : imgSrc ="./resources/images/characters/female-warrior.jpg"; break;
                case _this.HeroClassEnum.ROGUE : imgSrc = "./resources/images/characters/female-thief.jpg"; break;
                case _this.HeroClassEnum.RANGER : imgSrc = "./resources/images/characters/female-ranger.jpg"; break;
                default : imgSrc = "./resources/images/characters/card-priest-female.png";
            }
        }
        else {
            switch(hero.heroClass) {
                case _this.HeroClassEnum.PRIEST : imgSrc = "./resources/images/characters/card-priest-male.png"; break;
                case _this.HeroClassEnum.WARRIOR : imgSrc = "./resources/images/characters/card-warrior-male.png"; break;
                case _this.HeroClassEnum.ROGUE : imgSrc = "./resources/images/characters/female-thief.jpg"; break;
                default : imgSrc = "./resources/images/characters/card-priest-male.png";
            }
        }
        return imgSrc;
    };    
    
    this.chooseHeroSuccess = function(response) {
        logDebug("choose hero OK!");
        if(response) {
            printDebug(response.data.hero);
            if(response.data.battle && response.data.battle.mob && response.data.battle.hero && (!response.data.battle.status.fateAccepted && !response.data.battle.status.corpseLooted)) { // The hero is already in a fight
                battleView.startOrResumeBattle(response.data.battle);
                logDebug("you resume the battle!");
            }		
            else if(response.data.location.town)
                townView.drawTown(response.data.location.town);
            else
                mapView.drawMap(response);
        }
        logDebug(JSON.stringify(response.data));
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

    this.addHeroCard = function(hero) {
        var newHeroCard = $(".hero-card.template").clone();
        newHeroCard.removeClass("template");
        $(newHeroCard).find(".hero-name").html(hero.heroName);
        $(newHeroCard).find(".hero-text").html(hero.heroClass);
        $(newHeroCard).find(".card-img-top").attr("src", heroView.getHeroCardImage(hero));
        //$(newHeroCard).find(".card").attr("data-hero-name", hero.heroName);
        $(newHeroCard).attr("data-hero-name", hero.heroName);
        return newHeroCard;
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