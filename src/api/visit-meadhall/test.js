var { Logger } = require("om-hq-lib");
var { Battle } = require("om-hq-lib");
var { BattleActions } = require("om-hq-lib");
var handler = require("./index.js");
//var MAP = require("om-hq-map");


console.log("Started...");

var body = {
    accessToken: process.env["accessToken"]
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
