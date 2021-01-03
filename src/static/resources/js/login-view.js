var loginView = {};
$(function() {	
    loginView = new LoginView();
    $("#btnShowCreateLogin").click(function() {loginView.drawCreateLoginScreen();});	
	$("#btnCreateLogin").click(function() {loginView.createLogin();});	
    $("#btnLogin").click(function() {loginView.login();});
});

function LoginView() {
    var _this = this;
    var LOGIN_URL = "https://1r5188ua7k.execute-api.eu-north-1.amazonaws.com/login-fn";
    var CREATE_LOGIN_URL = "https://x45nyh9mub.execute-api.eu-north-1.amazonaws.com/DEV/xmas-fun-user-login";
    var maxHeroes = 3;
    var heroView = new HeroView();
    var welcomeMusic = {};

    this.createLogin = function() {
        var newClientLogin = {name:$("#newLogin").val(), password:$("#newPassword").val(), repeatedPassword:$("#newRepeatedPassword").val()};
        post(CREATE_LOGIN_URL, newClientLogin, _this.createLoginSuccess, _this.createLoginFailed);
    };
    
    this.createLoginSuccess = function(data) {
        logInfo("create login OK!");
        logInfo(JSON.stringify(data));
        $("#statusMessage").html("");
        drawLoginScreen();
    };
    
    this.createLoginFailed = function(errorMsg) {
        logInfo(errorMsg);
        $("#statusMessage").html(errorMsg.reason);
    };
    
    this.login = function() {
        welcomeMusic = soundPlayer.playSound("./resources/sounds/bard-intro.wav");
        var clientLogin = {userName:$("#login").val(), password:$("#password").val()};
        //callMethod("http://" + hostIp + ":" + hostPort, "login", clientLogin, loginSuccess, loginFailed);
        post(LOGIN_URL, clientLogin, loginSuccess, loginFailed);
    };

    this.stopWelcomeMusic = function() {
        soundPlayer.stop(welcomeMusic);
    };

    var drawHeroCard = function(hero) {
        var newHeroCard = $(".hero-card.template").clone();
        newHeroCard.removeClass("template");
        $(newHeroCard).find(".hero-name").html(hero.heroName);
        $(newHeroCard).find(".hero-text").html("");
        $(newHeroCard).find(".card-img-top").attr("src", heroView.getHeroCardImage(hero.heroClass));
        $(newHeroCard).find(".card").attr("data-hero-id", hero.heroId);
        return newHeroCard;
    };

    var addEmptyCards = function(freeHeroesCount) {
        var newHeroCard = $(".hero-card-empty.template").clone();
        newHeroCard.removeClass("template");        
        $(".heroes").append(newHeroCard);
    };
    
    var loginSuccess = function(serverGameSession) {
        logInfo("login OK!");
        logInfo(JSON.stringify(serverGameSession));
        
        $(".function").hide();
        $(".overlay").hide();
        $("#chooseHeroContainer").show();
        
        gameSession.publicKey = serverGameSession.publicKey;
        var heroes = serverGameSession.data.heroes;
    
        for(var heroIndex in heroes) {
            if(heroIndex > maxHeroes-1)
                break;
            var heroCard = drawHeroCard(heroes[heroIndex], heroIndex);
            $(".heroes").append(heroCard);
        }
        if(heroes.length < maxHeroes)
            addEmptyCards(maxHeroes-heroes.length);
        $(".card").click(function() {heroView.chooseHero(this);});	
    };
    
    var loginFailed = function(errorMsg) {
        logInfo(errorMsg);
        $("#loginStatus").html(errorMsg.reason);
    };

    this.drawLoginScreen = function() {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        $("#loginContainer").show();
        
        $("#container").css("background-image", "url('./resources/images/login-background.jpg')"); 
    };
    
    this.drawCreateLoginScreen = function() {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        $("#createLoginContainer").show();
        
        $("#container").css("background-image", "url('./resources/images/login-background.jpg')"); 
    };
}