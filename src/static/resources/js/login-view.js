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
    //var heroView = new HeroView();
    var welcomeMusic = {};
    const cardsEnum = {
        DEER: 0,
        SANTA: 1,
        CANDY_CANE: 2,
        GIFT: 3,
        GRINCH: 4,
        BONBON: 5,
        LOLLIPOP: 6,
        ANGEL: 7,
        GINGERBREAD_MAN: 8,
        XMAS_HAT: 9,
        NUT_CRACKER: 10,
        XMAS_TREE: 11
    };   

    this.buttonPushed = function(e) {
        var action = $(e.currentTarget).attr("data-action");
        if(action == "playRound") { _this.drawPlayScreen(); _this.playRound(e.currentTarget); }
        if(action == "showRewards") _this.showRewards();
        if(action == "showHighScore") _this.showHighScore();
    };

    this.showHighScoreSuccess = function(responseData) {
        var data = responseData.data;
        $(".function").hide();
        $(".overlay").hide();
        $("#highScoreContainer").show();
        $("#bottomToolbar").show();

        $("#highScoreItems").empty();
        var evenRow = true;        
        for(var i=0;i<data.length;i++) {
            var newItem = $("#highscoreItemTemplate").clone();
            newItem.removeClass("template");
            newItem.removeAttr("id");
            var sections = data[i].split("#");
            newItem.find(".highScoreScore").html(parseInt(sections[0]));
            newItem.find(".highScoreName").html(sections[1]);
            //if(evenRow) newItem.addClass("evenRow"); else newItem.addClass("oddRow"); evenRow=!evenRow; 
            $("#highScoreItems").append(newItem);
        }
    };

    this.showHighSshowHighScoreFailedcoreSuccess = function() {

    };

    this.showHighScore = function() {
        logDebug("Showing highscore!");

        var accessToken = getCookie("accessToken");
        var userGuid = getCookie("userGuid");
        var data = { userName:$("#login").val(), accessToken: accessToken, userGuid: userGuid};
        post("https://tt6ew5uusi.execute-api.eu-north-1.amazonaws.com/DEV/xmas-fun-get-high-score", data, _this.showHighScoreSuccess, _this.showHighScoreFailed);
    };

    this.getRewardAmount = function(cardType) {
        if(cardType == cardsEnum.DEER) return "1500/300/70";
        if(cardType == cardsEnum.SANTA) return "500/-/-";
        if(cardType == cardsEnum.CANDY_CANE) return "150/90/30";
        if(cardType == cardsEnum.GIFT) return "300/180/60";
        if(cardType == cardsEnum.GRINCH) return "-180/-120/-60";
        if(cardType == cardsEnum.BONBON) return "100/-/-";
        if(cardType == cardsEnum.LOLLIPOP) return "125/75/25";
        if(cardType == cardsEnum.ANGEL) return "30%/20%/10%";
        if(cardType == cardsEnum.GINGERBREAD_MAN) return "200/-/-";
        if(cardType == cardsEnum.XMAS_HAT) return "250/-/-";
        if(cardType == cardsEnum.NUT_CRACKER) return "-30%/-20%/-10%";
        if(cardType == cardsEnum.XMAS_TREE) return "360/215/-";
        return "-/-/-";
    };

    this.getRewardSpecial = function(cardType) {
        if(cardType == cardsEnum.GIFT) return "Extra turn";
        if(cardType == cardsEnum.ANGEL) return "Gives score in %";
        if(cardType == cardsEnum.NUT_CRACKER) return "Steals score in %";
        return "N/A";
    };    

    this.showRewards = function() {
        logDebug("Showing rewards!");
        
        $(".function").hide();
        $(".overlay").hide();
        $("#rewardsContainer").show();
        $("#bottomToolbar").show();
        
        $("#rewardItems").empty();
        var evenRow = true;
        for(var cardType=0;cardType<12;cardType++) {
            var newItem = $("#rewardItemTemplate").clone();
            newItem.removeClass("template");
            newItem.removeAttr("id");
            //if(evenRow) newItem.addClass("evenRow"); else newItem.addClass("oddRow"); evenRow=!evenRow;            
            var imgUrl = _this.getImageUrl(cardType);
            newItem.find("img").attr("src", imgUrl);
            newItem.find(".rewardAmount").html(_this.getRewardAmount(cardType));
            newItem.find(".rewardSpecial").html(_this.getRewardSpecial(cardType));

            $("#rewardItems").append(newItem);
        }
    };

    this.getImageUrl = function(cardType) {
        var imgFileName = "deer.jpg";
        if(cardType == cardsEnum.DEER) imgFileName = "deer.jpg";
        if(cardType == cardsEnum.SANTA) imgFileName = "santa.jpg";
        if(cardType == cardsEnum.CANDY_CANE) imgFileName = "candy-cane.jpg";
        if(cardType == cardsEnum.GIFT) imgFileName = "gift.jpg";
        if(cardType == cardsEnum.GRINCH) imgFileName = "grinch.jpg";
        if(cardType == cardsEnum.BONBON) imgFileName = "bonbon.jpg";
        if(cardType == cardsEnum.LOLLIPOP) imgFileName = "lollipop.jpg";
        if(cardType == cardsEnum.ANGEL) imgFileName = "angel.jpg";
        if(cardType == cardsEnum.GINGERBREAD_MAN) imgFileName = "gingerbread-man2.png";
        if(cardType == cardsEnum.XMAS_HAT) imgFileName = "xmas-hat.jpg";
        if(cardType == cardsEnum.NUT_CRACKER) imgFileName = "nut-cracker.jpg";
        if(cardType == cardsEnum.XMAS_TREE) imgFileName = "xmas-tree.jpg";
        return "./resources/images/xmas/" + imgFileName;
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
                
        $("#score").html(data.score);
        $("#totalScore").html(data.totalScore);
        $("#turnsUsed").html(data.turnsUsed + "/" + data.maxTurns);
        $("#turnsUsed").attr("data-turns-used", data.turnsUsed);
        $("#turnsUsed").attr("data-max-turns", data.maxTurns);
        if(data.score != 0) {
            $("#score").effect("pulsate", 1500);
            $("#totalScore").effect("pulsate", 1500);
        }
        if(data.score > 0) soundPlayer.playSound("./resources/sounds/success-bell.wav");
        if(data.score > 100) soundPlayer.playSound("./resources/sounds/merry-christmas-santa.mp3");
        if(data.score < 0) soundPlayer.playSound("./resources/sounds/loss.wav");
        if(data.turnsUsed < data.maxTurns) $(".commandButton[data-action=playRound]").addClass("active");
        else {
            $("#gameOverTextOverlay").show();
            soundPlayer.playSound("./resources/sounds/merry-christmas-ho-ho-ho.mp3");
        } 
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
        post("https://xgmawj42y0.execute-api.eu-north-1.amazonaws.com/DEV/xmas-fun-create-login", newClientLogin, _this.createLoginSuccess, _this.createLoginFailed);
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
        welcomeMusic = soundPlayer.playSound("./resources/sounds/intro.mp3");
        var clientLogin = { userName:$("#login").val(), password:$("#password").val() };
        //callMethod("http://" + hostIp + ":" + hostPort, "login", clientLogin, loginSuccess, loginFailed);
        post("https://x45nyh9mub.execute-api.eu-north-1.amazonaws.com/DEV/xmas-fun-user-login", clientLogin, loginSuccess, loginFailed);
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