var smithyView = {};
$(function() {	
    smithyView = new SmithyView();
    $("#btnVisitSmithy").click(function() {smithy.enter();});    
});

function SmithyView() {
    var _this = this;

    this.enter = function() {
        post("Town", "Smithy", gameSession, enterSuccess, enterFailed);
    };

    var enterSuccess = function(data) {
        logInfo("enter town OK!");
        logInfo(JSON.stringify(data));
        
        if(data.town && data.smithy) {
            var town = data.town;
            logInfo("Entering the smithy in [" + town.name + "]!");
            drawSmithy(data.smithy);
        }
        else
            logInfo("You have to be in a town to enter the smithy!");
    };

    var enterFailed = function(errorMsg) {
        logInfo(errorMsg);
    };

    var drawSmithy = function(smithy) {
        $(".function").hide();
        $(".overlay").hide();
        $(canvasLayer2).hide();
        $(canvasLayer1).hide();
        $("#smithyOverlay").show();
        $("#smithyInventory").show();
        $("#townBottomToolbar").show();
        
        $("#container").css("background-image", "url('./resources/images/smithy-background.jpg')"); 
        $("#smithyOverlay").html("Welcome to my smithy!<br/>");	
        $("#smithyOverlay").append("The smith has around " + smithy.copper + " copper pieces!<br/>");
            
        for(var itemIndex in smithy.items) {
            var name = smithy.items[itemIndex].name;
            var itemImgUrl = "./resources/images/org/items/StoneHatchet_Icon.png";
            
            if(name == "long sword")
                itemImgUrl = "./resources/images/items/StoneHatchet_Icon.png";
            else if(name == "wooden sword")
                itemImgUrl = "./resources/images/items/the_axe_in_the_basement.png";
            else if(name == "silver long sword")
                itemImgUrl = "./resources/images/items/128px-Wooden_Shield.png";					
            
            $(".smithyItemContainer:eq(" + itemIndex + ")").html('<img src="' + itemImgUrl + '" alt="' + name + '" title="' + name + '" style="height: 64px; width: 64px; position: absolute; top:6px; left: 6px;" />');
            $(".smithyItemContainer:eq(" + itemIndex + ")").append('<div class="itemDetails" style="height: 64px; width: 64px; position: absolute; top:6px; left: 6px;"></div>');
            $(".smithyItemContainer").mouseover(function() { console.log("show item popup..."); });
            $(".smithyItemContainer").click(function() { post("Smithy", "BuyItem", gameSession, buyItemSuccess, buyItemFailed); });
            
            // Maximum of 6 items
            if (itemIndex > 5) {
                break;
            }
        }
    };
    

    // OLD
    function buySmithyItem(itemKey) {
        gameSession.itemKey = itemKey;
        callMethod("http://" + hostIp + ":" + hostPort, "buySmithyItem", gameSession, buySmithyItemSuccess, buySmithyItemFailed);
    };
    
    var buyItemSuccess = function(data) {
        logInfo("call to buy smithy item succeeded!");
        logInfo(JSON.stringify(data));
        
        if(data.town && data.smithy) {
            if (data.buy.status == 1) {
                // play buy success sound
                // show buy overlay
            }
            else {
                // play buy failed sound or none
                // show buy failed overlay (data.buy.failure)
            }
            drawSmithy(data.smithy);
        }
        else
            logInfo("You have to be in a town with a smithy to enter a smithy!");
    };
    
    var buyItemFailed = function(errorMsg) {
        logInfo(errorMsg);
    };
    
    function sellSmithyItem(itemKey) {
        gameSession.itemKey = itemKey;
        callMethod("http://" + hostIp + ":" + hostPort, "sellSmithyItem", gameSession, sellSmithyItemSuccess, sellSmithyItemFailed);
    };
    
    function sellSmithyItemSuccess(data) {
        logInfo("call to sell smithy item succeeded!");
        logInfo(JSON.stringify(data));
        
        if(data.town && data.smithy) {
            if (data.sell.status == 1) {
                // play sell success sound
                // show sell overlay
            }
            else {
                // play sell failed sound or none
                // show sell failed overlay (data.sell.failure)
            }
            drawSmithy(data.smithy);
        }
        else
            logInfo("You have to be in a town with a smithy to enter a smithy!");
    };
    
    function sellSmithyItemFailed(errorMsg) {
        logInfo(errorMsg);
    };
    
}