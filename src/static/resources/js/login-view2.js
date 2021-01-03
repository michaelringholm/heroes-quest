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
    var maxHeroes = 3;
    var LOGIN_URL = "https://x45nyh9mub.execute-api.eu-north-1.amazonaws.com/DEV/xmas-fun-user-login";
    var CREATE_LOGIN_URL = "https://x45nyh9mub.execute-api.eu-north-1.amazonaws.com/DEV/xmas-fun-user-login";

    //var heroView = new HeroView();
    var welcomeMusic = {};

    this.buttonPushed = function(e) {
        var action = $(e.currentTarget).attr("data-action");
        if(action == "playRound") { _this.drawPlayScreen(); _this.playRound(e.currentTarget); }
        if(action == "showRewards") _this.showRewards();
        if(action == "showHighScore") _this.showHighScore();
    };

    this.changeCard = function(cardIndex, cardType) {
        var imgUrl = _this.getImageUrl(cardType);
        $(".cards .card:nth(" + cardIndex + ") img").attr("src", imgUrl);
    };

    this.playRoundSuccess = function(response) {        
        var data = response.data;
        _this.changeCard(0, data.card1);
        _this.changeCard(1, data.card2);
        _this.changeCard(2, data.card3);
                
    };

    this.playRoundFailed = function(data) {
        $(".commandButton[data-action=playRound]").addClass("active");
    };

    this.playRound = function() {
        var turnsUsed = parseInt($("#turnsUsed").attr("data-turns-used"));
        var maxTurns = parseInt($("#turnsUsed").attr("data-max-turns"));

        if(turnsUsed < maxTurns ) {
            if($(".commandButton[data-action=playRound]").hasClass("active")) {
                $(".commandButton[data-action=playRound]").removeClass("active");
                soundPlayer.playSound("./resources/sounds/mix-deck.wav");
                var accessToken = getCookie("accessToken");
                var userGuid = getCookie("userGuid");
                var data = { userName:$("#login").val(), accessToken: accessToken, userGuid: userGuid};
                post("https://xg77iuziq8.execute-api.eu-north-1.amazonaws.com/DEV/xmas-fun-play-round", data, _this.playRoundSuccess, _this.playRoundFailed);
            }
        }
        else {
            logDebug("No turns left, sorry!");
        }
    };

    this.createLogin = function() {
        var newClientLogin = {userName:$("#newLogin").val(), password:$("#newPassword").val(), repeatedPassword:$("#newRepeatedPassword").val()};
        post(_this.CREATE_LOGIN_URL, newClientLogin, _this.createLoginSuccess, _this.createLoginFailed);
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
        var clientLogin = { userName:$("#login").val(), password:$("#password").val() };
        //callMethod("http://" + hostIp + ":" + hostPort, "login", clientLogin, loginSuccess, loginFailed);
        post(_this.LOGIN_URL), clientLogin, loginSuccess, loginFailed);
    };

    this.stopWelcomeMusic = function() {
        soundPlayer.stop(welcomeMusic);
    };

    var drawCards = function(hero) {
        var newHeroCard = $(".hero-card.template").clone();
        newHeroCard.removeClass("template");
        $(newHeroCard).find(".hero-name").html(hero.heroName);
        $(newHeroCard).find(".hero-text").html("");
        $(newHeroCard).find(".card-img-top").attr("src", heroView.getHeroCardImage(hero.heroClass));
        $(newHeroCard).find(".card").attr("data-hero-id", hero.heroId);
        return newHeroCard;
    };

    var addEmptyCard = function() {
        var emptyCard = $(".hero-card-empty.template").clone();
        emptyCard.removeClass("template");        
        $(".cards").append(emptyCard);
    };

    this.drawPlayScreen = function() {
        $(".function").hide();
        $(".overlay").hide();
        $("#cardContainer").show();
        $("#bottomToolbar").show();
        $("#topToolbar").show();
        //var card = drawCards();
        //$(".cards").append(card);
        if(parseInt($("#turnsUsed").attr("data-turns-used")) == parseInt($("#turnsUsed").attr("data-max-turns"))) {
            $("#gameOverTextOverlay").show();
            $(".commandButton[data-action=playRound]").removeClass("active");
            soundPlayer.playSound("./resources/sounds/merry-christmas-ho-ho-ho.mp3");
        }
    };

    var loginSuccess = function(responseData) {
        logDebug("login OK!");
        logDebug(JSON.stringify(responseData));
        setCookie("accessToken", responseData.data.accessToken, 1);
        setCookie("userGuid", responseData.data.userGuid, 1);
        
        $("#score").html("-");
        $("#totalScore").html(responseData.data.score.N);
        $("#turnsUsed").html(responseData.data.turnsUsed.N + "/" + responseData.data.maxTurns);
        $("#turnsUsed").attr("data-turns-used", responseData.data.turnsUsed.N);
        $("#turnsUsed").attr("data-max-turns", responseData.data.maxTurns);
        
        addEmptyCard();
        addEmptyCard();
        addEmptyCard();

        _this.drawPlayScreen();
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
        
        $("#container").css("background-image", "url('./resources/images/xmas/login-background.jpg')"); 
    };
    
    this.drawCreateLoginScreen = function() {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        $("#createLoginContainer").show();
        
        $("#container").css("background-image", "url('./resources/images/xmas/login-background.jpg')"); 
    };
}