var Logger = require('../common/Logger.js');
var BattleActions = require('./BattleActions.js');
var Hero = require('../hero/Hero.js');
var HeroDAO = require('../hero/HeroDAO.js');
var BattleDAO = require('./BattleDAO.js');


module.exports =
	function Battle(battleDTO, heroDTO) {
		var _this = this;
		this.battleDTO = battleDTO;
		this.heroDTO = heroDTO;
		this.heroKey;
		this.userGuid;

		this.getVersion = function () {
			return "0.0.0.2";
		};

		this.nextRound = function (userGuid, heroKey, heroBattleAction, callback) {
			Logger.logInfo("Battle.nextRound");
			_this.heroKey = heroKey;
			_this.userGuid = userGuid;
			if(!_this.battleDTO.hero.conditions) _this.battleDTO.hero.conditions = new Array();
			if(!_this.battleDTO.mob.conditions) _this.battleDTO.mob.conditions = new Array();
			_this.battleDTO.hero.currentBattleAction = heroBattleAction;
			predictMobBattleAction();

			if (_this.battleDTO.status.over) {
				Logger.logInfo("battle is over!");
				saveState(callback); return;
			}
			
			_this.battleDTO.round++;
			//_this.battleDTO.hero.hp += 500; // TEMP HACK
			//_this.battleDTO.mob.hp += 500; // TEMP HACK			
			var roundInfo = getRoundInfo();
			Logger.logInfo("*****ROUND INFO*******\n"+roundInfo);
			var firstUp = getFirstUp(_this.battleDTO.hero, _this.battleDTO.mob);
			var secondUp = getSecondUp(_this.battleDTO.hero, _this.battleDTO.mob);

			attack(firstUp, secondUp);

			if (secondUp.hp <= 0) {
				battleEnded(firstUp, secondUp, (err, heroDTO) => {
					if(err) { Logger.logError(err); callback(err, null); return; }
					saveState(callback); return;
				});
			}
			else {
				attack(secondUp, firstUp);

				if (firstUp.hp <= 0) {
					battleEnded(secondUp, firstUp, (err, heroDTO) => {
						if(err) { Logger.logError(err); callback(err, null); return; }
						saveState(callback); return;
					});
				}
				else {
					regen();
					saveState(callback); return;
				}
			}

			//Logger.logInfo(JSON.stringify(_this.battleDTO.hero));
			//Logger.logInfo(JSON.stringify(_this.battleDTO.mob));
		};

		this.nextRoundAsync = async function (userGuid, heroKey, heroBattleAction) {
			Logger.logInfo("Battle.nextRoundAsync");
			_this.heroKey = heroKey;
			_this.userGuid = userGuid;
			if(!_this.battleDTO.hero.conditions) _this.battleDTO.hero.conditions = new Array();
			if(!_this.battleDTO.mob.conditions) _this.battleDTO.mob.conditions = new Array();
			_this.battleDTO.hero.currentBattleAction = heroBattleAction;
			predictMobBattleAction();

			if (_this.battleDTO.status.over) {
				Logger.logInfo("battle is over!");
				_this.heroDTO.isInBattle = false;
				await saveStateAsync(); 
				return _this.battleDTO;
			}
			
			_this.battleDTO.round++;
			//_this.battleDTO.hero.hp += 500; // TEMP HACK
			//_this.battleDTO.mob.hp += 500; // TEMP HACK			
			var roundInfo = getRoundInfo();
			Logger.logInfo("*****ROUND INFO*******\n"+roundInfo);
			var firstUp = getFirstUp(_this.battleDTO.hero, _this.battleDTO.mob);
			var secondUp = getSecondUp(_this.battleDTO.hero, _this.battleDTO.mob);

			attack(firstUp, secondUp);
			if (secondUp.hp <= 0) await battleEndedAsync(firstUp, secondUp);
			else {
				attack(secondUp, firstUp);
				if (firstUp.hp <= 0) await battleEndedAsync(secondUp, firstUp);
				else regen();
			}
			await saveStateAsync(); 
			return _this.battleDTO;
		};

		this.acceptFateAsync = async function (userGuid, heroKey) {
			Logger.logInfo("Battle.nextRoundAsync");
			_this.heroKey = heroKey;
			_this.userGuid = userGuid;
			delete _this.battleDTO.fateAccepted;
			_this.battleDTO.status.fateAccepted = true;
			await saveStateAsync(); 
		};		

		var getRoundInfo = function() {
			var roundInfo = "Round:" +  _this.battleDTO.round + "\n";
			roundInfo += "Hero HP:" + _this.battleDTO.hero.hp + "\n";
			roundInfo += "Hero ACT:" + _this.battleDTO.hero.currentBattleAction + "\n";
			roundInfo += "Mob HP:" + _this.battleDTO.mob.hp + "\n";
			roundInfo += "Mob ACT:" + _this.battleDTO.mob.currentBattleAction + "\n";
			return roundInfo;
		};

		var predictMobBattleAction = function() {
			var mob = _this.battleDTO.mob;
			if(mob.atkTypes.length <= 0) { Logger.logError("No attack types defined for mob!"); mob.currentBattleAction = BattleActions.BattleActions.MELEE; return; }
			var rand = Math.random();
			Logger.logInfo("Rand:"+rand);
			Logger.logInfo("Mob.atkTypes.len:"+mob.atkTypes.length);
			var randomAtkIndex = Math.round(rand*(mob.atkTypes.length-1));
			mob.currentBattleAction = mob.atkTypes[randomAtkIndex];
			Logger.logInfo("AtkIndx:"+randomAtkIndex);
			Logger.logInfo("Mob.ACT:"+mob.currentBattleAction);
		}

		var attack = function (attacker, defender) {
			Logger.logInfo("Battle.attack");			
			var fnBattleAction = getBattleAction(attacker.currentBattleAction);			
			fnBattleAction(attacker, defender);			
		};

		var getBattleAction = function(battleAction) {
			if(battleAction) battleAction = battleAction.toLowerCase().trim();
			if (battleAction == "melee") return meleeAttack;
			if (battleAction == "heal") return heal;
			if (battleAction == "poison i") return poisonI;
			
			Logger.logError("Battle action [" + battleAction + "] not implemented, reverting to melee attack!");
			return meleeAttack;			
		};

		var meleeAttack = function (attacker, defender) {
			var rawDamage = Math.round(attacker.minAtk + (Math.random() * (attacker.maxAtk - attacker.minAtk)));
			var damageImpact = rawDamage - defender.ac;
			if (damageImpact < 0)
				damageImpact = 0;

			attacker.abilityImpact = damageImpact;
			defender.hp = defender.hp - damageImpact;
		};

		var heal = function (attacker, defender) {
			var healTarget = attacker;
			var healAmount = Math.round(healTarget.level + (Math.random() * (healTarget.level + 6)));
			if (healAmount < 0) healAmount = 0;
			if ((healAmount + healTarget.hp) > healTarget.baseHp) healTarget.hp = healTarget.baseHp;
			else healTarget.hp += healAmount;
			healTarget.abilityImpact = healAmount;
		};

		var poisonI = function (attacker, defender) {
			var rand = Math.random();
			if(!attacker.level) attacker.level = 1; // TEMP FIX
			var poisonDmg = Math.round(attacker.level + (rand * (attacker.level + 6)));
			if(!poisonDmg) Logger.logError("Poison damage is somehow null, rand=["+rand+"] attacker=["+JSON.stringify(attacker)+"]");
			if(!poisonDmg || poisonDmg < 0) poisonDmg = 0;			
			defender.hp -= poisonDmg;
			attacker.abilityImpact = poisonDmg;			
			defender.conditions.push("poisonI");
		};			

		var getFirstUp = function (playerX, playerY) {
			if (playerX.luck > playerY.luck) return playerX;
			return playerY;
		};

		var getSecondUp = function (playerX, playerY) {
			if (playerX.luck > playerY.luck) return playerY;
			return playerX;
		};

		var battleEndedAsync = async function (winner, loser) {			
			_this.battleDTO.status.over = true;
			_this.heroDTO.isInBattle = false;

			if (winner.heroId == _this.battleDTO.hero.heroId) {
				_this.battleDTO.status.winner = winner.heroName;
				_this.battleDTO.status.loser = loser.name;
				Logger.logInfo(winner.heroName + " won! and " + loser.name + " lost!");
				heroWon();
			}
			else {
				_this.battleDTO.status.winner = winner.name;
				_this.battleDTO.status.loser = loser.heroName;
				Logger.logInfo(winner.name + " won! and " + loser.heroName + " lost!");
				heroLostAsync(heroDTO);
			}			
		};

		var heroWon = function () {
			Logger.logInfo("hero won the battle!");
			_this.battleDTO.hero.xp += _this.battleDTO.mob.xp;
			_this.battleDTO.hero.gold += _this.battleDTO.mob.gold;
			_this.battleDTO.hero.silver += _this.battleDTO.mob.silver;
			_this.battleDTO.hero.copper += _this.battleDTO.mob.copper;

			for (var itemIndex in _this.battleDTO.mob.items)
				_this.battleDTO.hero.items.push(_this.battleDTO.mob.items[itemIndex]);
		};

		var heroLost = function (callback) {
			Logger.logInfo("hero lost the battle!");
			new Hero(_this.battleDTO.hero).died(_this.battleDTO.mob, (err, heroDTO) => {
				if(err) { Logger.logError(err); callback(err, null); return; }
				callback(null, heroDTO);
			});
		};

		var heroLostAsync = async function () {
			Logger.logInfo("hero lost the battle!");
			var heroDTO = await new Hero(_this.battleDTO.hero).diedAsync(_this.battleDTO.mob);
			return heroDTO;
		};		

		var regen = function () {
			_this.battleDTO.hero.hp += _this.battleDTO.hero.regen;
			_this.battleDTO.mob.hp += _this.battleDTO.mob.regen;

			if (_this.battleDTO.hero.hp > _this.battleDTO.hero.baseHp)
				_this.battleDTO.hero.hp = _this.battleDTO.hero.baseHp;
			if (_this.battleDTO.mob.hp > _this.battleDTO.mob.baseHp)
				_this.battleDTO.mob.hp = _this.battleDTO.mob.baseHp;
		};		

		var saveState = function(callback) {
			Logger.logInfo("Battle.saveState()");
			BattleDAO.save(_this.heroKey, _this.battleDTO, (err, battleDTO) => {
				if(err) { Logger.logError(err); callback(err, null); return; }
				HeroDAO.save(_this.userGuid, _this.heroDTO, (err, heroDTO) => {
					if(err) { Logger.logError(err); callback(err, null); return; }
					callback(null, _this.battleDTO);
				});
			});	
		};

		var saveStateAsync = async function() {
			Logger.logInfo("Battle.saveStateAsync()");
			var battleDTO = await BattleDAO.saveAsync(_this.heroKey, _this.battleDTO);
			var heroDTO = await HeroDAO.saveAsync(_this.userGuid, _this.heroDTO);
			return _this.battleDTO;
		};		

		this.drawB = function () {
			_this.drawP(_this.battleDTO.hero);
			_this.drawP(_this.battleDTO.mob);
		};

		this.drawP = function (p) {
			//$(p.div).html("a:" + p.a + " # h:" + p.h);
		};		

		var flee = function (callback) {
			Logger.logInfo("Battle.flee");

			if (_this.status.over) {
				Logger.logInfo("battle is over!");
				return;
			}
			else
				_this.battleDTO.round++;

			var firstUp = getFirstUp(_this.battleDTO.hero, _this.battleDTO.mob);
			var secondUp = getSecondUp(_this.battleDTO.hero, _this.battleDTO.mob);

			attack(firstUp, secondUp);

			if (secondUp.hp <= 0) {
				battleEnded(firstUp, secondUp, (err, heroDTO) => {
					if(err) { Logger.logError(err); callback(err, null); return; }
					callback(null, heroDTO);
				});
			}
			else {
				attack(secondUp, firstUp);

				if (firstUp.hp <= 0) {
					battleEnded(secondUp, firstUp, (err, heroDTO) => {
						if(err) { Logger.logError(err); callback(err, null); return; }
						callback(null, heroDTO);
					});
				}
				else {
					regen();
					callback(null, {});
				}
			}

			//Logger.logInfo(JSON.stringify(_this.battleDTO.hero));
			//Logger.logInfo(JSON.stringify(_this.battleDTO.mob));
		};

		this.construct = function () {
			Logger.logInfo("Battle.construct");
			/*_this.drawB();
			$("#nextR").click(function() { 
				_this.nextR( {aT:"mel"}, {aT:"mel"} ); 
			});*/
		};

		_this.construct();
	}