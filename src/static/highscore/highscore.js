$(function() {
    console.log("jquery initialized!");
    fillHighscoreBoard();
});

function fillHighscoreBoard() {
    var evenRow = true;
    for(var i=0;i<10;i++) {
        var highscoreItem = $("#highscoreItemTemplate").clone();
        highscoreItem.removeClass("template");
        highscoreItem.removeAttr("id");
        if(evenRow) highscoreItem.addClass("evenRow"); else highscoreItem.addClass("oddRow"); evenRow=!evenRow; 
        $("#highscoreWidget").append(highscoreItem);
    }
};