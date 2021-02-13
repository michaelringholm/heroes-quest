var { Logger } = require("om-hq-lib");
var { MidgaardMainMap } = require("om-hq-lib");
var { MobFactory } = require("om-hq-lib");
var handler = require("./index.js");
//var MAP = require("om-hq-map");


console.log("Started...");
//data = { hero: { heroName: "Krom", heroClass: "WARRRIOR"} }

var body = {
    accessToken: "8ad11007-fe07-4e7d-8f10-38f0d1cc6b6d"
    //activeHeroName: "Krom",
};

var request = { 
    requestContext: { http: { method:"POST" } },
    headers: { origin:"http://localhost" },
    headers: { referer:"http://localhost" },
    body: JSON.stringify(body)
};

handler.handler(request, null, (err, response) => {
    if(err) console.error(err);
    console.log(response);
    console.log("Done.");
});
