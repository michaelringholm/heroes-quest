const AWS = require("aws-sdk");
const UUID = require('uuid');

// Callback is (error, response)
exports.validateAccessToken = function(userName, accessToken, callback) {
    //console.log(JSON.stringify(event));
    //AWS.config.update({region: 'eu-central-1'});

    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    
    var params = {
      TableName: 'xmas-fun-login',
      Key: {
        'userName': {S: userName}
      }
    };
    
    ddb.getItem(params, function(err, userData) {
       if (err) { console.error(err); callback(false, err); }
       else {
            console.log(JSON.stringify(userData));
            if(userData == null || userData.Item == null || userData.Item.accessToken == null) {
                callback(false, "User token not found");
            }
            else {
                if(userData.Item.accessToken.S == accessToken) {
                    callback(true, "Access token accepted");
                }
                else {
                    callback(false, "Invalid access token");
                }
            }
       }
    });

};