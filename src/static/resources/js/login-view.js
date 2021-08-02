var loginView = {};
$(function() {	
    loginView = new LoginView();
    $("#btnShowCreateLogin").click(function() {loginView.drawCreateLoginScreen();});	
	$("#btnCreateLogin").click(function() {loginView.createLogin();});	
    $("#btnLogin").click(function() {loginView.login();});

    $(".commandButton").click(function(e, t) { loginView.buttonPushed(e); });
});

function LoginView() {
    var _this = this;
    var LOGIN_URL = "https://1r5188ua7k.execute-api.eu-north-1.amazonaws.com/login-fn"; 
    var CREATE_LOGIN_URL = "https://a95r6wbcca.execute-api.eu-north-1.amazonaws.com/create-login-fn";
    var maxHeroes = 3;
    var welcomeMusic = {};

    this.buttonPushed = function(e) {
        var action = $(e.currentTarget).attr("data-action");
        if(action == "createHero") { heroView.drawCreateHeroScreen(e.currentTarget); }
    };

    this.createLogin = function() {
        var newClientLogin = {userName:$("#newLogin").val(), password:$("#newPassword").val(), passwordRepeated:$("#newRepeatedPassword").val()};
        post(CREATE_LOGIN_URL, newClientLogin, _this.createLoginSuccess, _this.createLoginFailed);
    };
    
    this.createLoginSuccess = function(data) {
        logInfo("create login OK!");
        logInfo(JSON.stringify(data));
        $("#statusMessage").html("");
        _this.drawLoginScreen();
    };
    
    this.createLoginFailed = function(errorMsg) {
        logInfo(errorMsg);
        $("#statusMessage").html(errorMsg.reason);
    };
    
    this.login = function() {
        welcomeMusic = soundPlayer.playSound("./resources/sounds/bard-intro.wav");
        var clientLogin = {userName:$("#login").val(), password:$("#password").val()};
        gameSession.setUserName($("#login").val());
        //callMethod("http://" + hostIp + ":" + hostPort, "login", clientLogin, loginSuccess, loginFailed);
        post(LOGIN_URL, clientLogin, loginSuccess, loginFailed);
    };

    this.stopWelcomeMusic = function() {
        soundPlayer.stop(welcomeMusic);
    };

    var addHeroCard2 = function(hero) {
        var newHeroCard = $(".hero-card.template").clone();
        newHeroCard.removeClass("template");
        $(newHeroCard).find(".hero-name").html(hero.heroName);
        $(newHeroCard).find(".hero-text").html(hero.heroClass);
        $(newHeroCard).find(".card-img-top").attr("src", heroView.getHeroCardImage(hero));
        //$(newHeroCard).find(".card").attr("data-hero-name", hero.heroName);
        $(newHeroCard).attr("data-hero-name", hero.heroName);
        return newHeroCard;
    };

    var addEmptyCards = function(freeHeroesCount) {
        for(var i=0; i<freeHeroesCount; i++) {
            var newHeroCard = $(".hero-card-empty.template").clone();
            newHeroCard.removeClass("template");        
            $(".heroes").append(newHeroCard);
        }        
    };
    
    var loginSuccess = function(login) {
        logInfo("login OK!");
        logInfo(JSON.stringify(login));
        gameSession.setUserGuid(login.data.userGuid);
        gameSession.setAccessToken(login.data.accessToken);
        
        $(".function").hide();
        $(".overlay").hide();
        $("#chooseHeroContainer").show();
        
        //login.publicKey = login.publicKey;
        var heroes = login.data.heroes;
    
        for(var heroIndex in heroes) {
            if(heroIndex > maxHeroes-1)
                break;
            var heroCard = heroView.addHeroCard(heroes[heroIndex], heroIndex);
            $(".heroes").append(heroCard);
        }
        if(heroes == null) addEmptyCards(maxHeroes);
        else if(heroes.length < maxHeroes) addEmptyCards(maxHeroes-heroes.length);
        $(".hero-card").click(function() {heroView.chooseHero(this);});
        $("#loginBottomToolbar").show();
        $("#topToolbar").show();
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