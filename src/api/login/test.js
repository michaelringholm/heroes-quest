var { Logger } = require("om-hq-lib");
var { MidgaardMainMap } = require("om-hq-lib");
var { MobFactory } = require("om-hq-lib");
var handler = require("./index.js");
//var MAP = require("om-hq-map");


console.log("Started...");
data = { hero: { heroName: "Krom", heroClass: "WARRRIOR"} }

var body = {
    userName: "ethlore",
    password: "test"
};

var request = { 
    requestContext: { http: { method:"POST" } },
    headers: { origin:"http://localhost" },
    headers: { referer:"http://localhost" },
    body: JSON.stringify(body)
};

handler.handler(request, null, (err,response) => {
    if(err) console.error(err);
    console.log(response);
    console.log("Done.");
});
//new COM().Logger.warn("This is a warning!");
//new MMM();
//new FV.FieldVerifier().Verify(data, ["hero.heroName", "hero.heroClass2"]);
