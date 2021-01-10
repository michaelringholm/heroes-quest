const FV = require("./field-verifier.js");


console.log("Started...");
data = { hero: { heroName: "Krom", heroClass: "WARRRIOR"} }
new FV.FieldVerifier().Verify(data, ["hero.heroName", "hero.heroClass2"]);
console.log("Done.");