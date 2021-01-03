var gameSession = {};
var canvasLayer1 = document.getElementById("canvasLayer1");
var canvasLayer2 = document.getElementById("canvasLayer2");
var canvasHeight = 0;
var canvasWidth = 0;
var hostIp = "";
var hostPort = 0;

$(function() {
	//includeHTML();
	//hostIp = "www.opusmagus.com";
	//hostPort = 83;
	//hostIp = "sundgaard.ddns.net";
	hostIp = "localhost";
	hostPort = 1337;
	
	canvasLayer1 = document.getElementById("canvasLayer1");
	canvasLayer2 = document.getElementById("canvasLayer2");
	canvasWidth = 1200;
	canvasHeight = 800;
	canvasLayer1.width = canvasWidth;
	canvasLayer1.height = canvasHeight;
	canvasLayer2.width = canvasWidth;
	canvasLayer2.height = canvasHeight;		
  
	$("#muteSound").click(function() {muteSound()});
	$("#gSessionId").html("gSessionId: N/A");
	$("#toggleDebug").click(function() {toggleDebug()});
});


function toggleDebug() {
	$("#debugInfo").toggle();
	$("#jsonInfo").toggle();
};

function muteSound() {
	soundPlayer.muteAll();
};

function printDebug(hero) {
	$("#debugInfo").html("DEBUG:");
	
	if (hero) {
		$("#debugInfo").append("<br>Name:" + hero.heroName);
		$("#debugInfo").append("<br>Class:" + hero.heroClass);
		$("#debugInfo").append("<br>Base HP:" + hero.baseHp);
		$("#debugInfo").append("<br>HP:" + hero.hp);
		$("#debugInfo").append("<br>Base Mana:" + hero.baseMana);
		$("#debugInfo").append("<br>Mana:" + hero.mana);
		$("#debugInfo").append("<br>XP:" + hero.xp);
		$("#debugInfo").append("<br>Level:" + hero.level);
		$("#debugInfo").append("<br>Int:" + hero.int);
		$("#debugInfo").append("<br>Sta:" + hero.sta);
		$("#debugInfo").append("<br>Str:" + hero.str);
		$("#debugInfo").append("<br>Regen:" + hero.regen);
		$("#debugInfo").append("<br>Min Atk:" + hero.minAtk);
		$("#debugInfo").append("<br>Max Atk:" + hero.maxAtk);
		$("#debugInfo").append("<br>Copper:" + hero.copper);
	}
}

function printJson(json) {
	$("#jsonInfo").html(json);
}

function logInfo(msg) {
	$("#status").prepend("[INFO]: " + msg + "<br/>");
} 

function logError(msg) {
	$("#status").prepend("[ERROR]: " + msg + "<br/>");
	console.error(msg);
} 

function getMobImgSrc(mob) {
	var imgSrc = null;
	imgSrc = "./resources/images/mobs/" + mob.key + ".png";
	
	if (!imgSrc) {
		logInfo("No image found for mob [" + mob.key + "]!");
		return "./resources/images/mobs/wild-boar.png";
	}
		
	return imgSrc;		
}

function post(apiUrl, data, fnSuccess, fnError) {	
	//callMethod("http://" + hostIp + ":" + hostPort, controller + "/" + methodName, data, fnSuccess, fnError);
	callMethod(apiUrl, data, fnSuccess, fnError);
}

function callMethod(apiUrl, data, fnSuccess, fnError) {
	$.ajax({
			type: "POST",
			dataType: "json",
			origin: "http://localhost",
			crossDomain: true,
			xhrFields: {
				'withCredentials': false // tell the client to send the cookies if any for the requested domain
			 },
			contentType: "application/json",
			data: JSON.stringify(data),
			url: apiUrl,
			//cache: false,
			beforeSend : function() {},
			success: function(data)	{
				logInfo("call succeeded!");
				if(data) printJson(JSON.stringify(data));
				if(fnSuccess) fnSuccess(data);
			},
			error: function(error, status) {
				logDebug("call failed!");
				logDebug(JSON.stringify(error));
				//if(error && error.responseJSON) printJson(error.responseJSON);
				//if(fnError) fnError(error.responseJSON);
			},			
			complete : function() {}
	});
}

function setCookie(cookieName, cookieValue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();
	document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/";
}

function getCookie(cookieName) {
	var name = cookieName + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
	  var c = ca[i];
	  while (c.charAt(0) == ' ') {
		c = c.substring(1);
	  }
	  if (c.indexOf(name) == 0) {
		return c.substring(name.length, c.length);
	  }
	}
	return "";
  }