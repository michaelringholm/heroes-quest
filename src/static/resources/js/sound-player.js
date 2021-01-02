var soundPlayer = {};
$(function() {	
    soundPlayer = new SoundPlayer();
});

function SoundPlayer() {
    var _this = this;
    var audioPlayers = new Array();

    this.playSound = function(soundPath) {
        var audio = new Audio(soundPath);
        audioPlayers.push(audio);
        audio.play();
        return audio;
    };

    this.stop = function(audio) {
        audio.pause();
        audio.currentTime = 0;
    };

    this.muteAll = function(audio) {
        for(var audioPlayerIndex in audioPlayers) {
            audioPlayers[audioPlayerIndex].pause();
        }
    };
}