function FieldVerifier() {
    this.Verify = function(data, expectedFields) {
        console.log("Verifying fields...");
        var missingFields = [];
        for(var i=0;i<expectedFields.length;i++) {            
            var expectedFieldExpr = expectedFields[i];
            //console.log("Checking for field [" + expectedFieldExpr + "]");
            var expectedFieldParts = expectedFieldExpr.split(".");
            var tmp = data;
            for(var j=0;j<expectedFieldParts.length;j++) {
                var nextPart = expectedFieldParts[j];
                //console.log("Checking next part [" + nextPart + "]");
                tmp = tmp[nextPart];
                //console.log("Part value was [" + tmp + "]");
            }
            if(tmp == null) {console.error("Field [" + expectedFieldExpr + "]" + " was missing."); missingFields.push(expectedFieldExpr); }
        }
        return missingFields;
    };
};

exports.FieldVerifier = FieldVerifier;
