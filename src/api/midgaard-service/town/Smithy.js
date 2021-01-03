var _logger = require('../common/Logger.js');
var _itemFactory = require('../item/ItemFactory.js');

module.exports = function Smithy() {

	var _this = this;
	
	this.copper = 500;
	this.items = [{id: "f931ad6f-ef91-120d-9f2b-fde6a00757a6",name:"wooden sword",cost:1,atkMin:1,atkMax:3},{id: "b665d5fb-6ca9-5ac1-9efa-603407ab24c6", name:"long sword",cost:20,atkMin:2,atkMax:4},{id: "4a86074a-2ffb-a088-806f-c6c3f4fa98ae",name:"silver long sword",cost:1000,atkMin:3,atkMax:6}];
	
	this.buyItem = function(itemId, hero) {
		var item = _itemFactory.create(itemId);
		if (hero.copper > item.cost) {
				hero.copper -= item.cost;
				hero.items.push(itemId);
				return { status:true, reason:"Item bought!" };
		}
		else {
			return { status:false, reason:"Can't afford item!" };
		}		
	};
	
	this.sellItem = function(itemId, hero) {
		var item = _itemFactory.create(itemId);
		
				// Find and remove equipped item from inventory
		var itemIndexToSell = -1;
		for(var itemIndex in hero.items) {
			if (hero.items[itemIndex] == itemId) {
				itemIndexToSell = itemIndex;
				break;
			}
		}
		
		if (itemIndexToSell > -1) {
				hero.copper += item.cost;
				items.splice(itemIndexToSell, 1);
				return { status:true, reason:"Item sold!" };
		}
		else {
			return { status:false, reason:"Can't find item in inventory!" };
		}	
	};	
}