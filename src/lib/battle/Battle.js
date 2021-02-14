var _logger = require('../common/Logger.js');
var BattleActions = require('./BattleActions.js');
var Hero = require('../hero/Hero.js');

module.exports =
	function Battle(battleDTO) {
		var _this = this;
		this.battleDTO = battleDTO;

		this.getVersion = function () {
			return "0.0.0.2";
		};

		this.drawB = function () {
			_this.drawP(_this.battleDTO.hero);
			_this.drawP(_this.battleDTO.mob);
		};

		this.drawP = function (p) {
			//$(p.div).html("a:" + p.a + " # h:" + p.h);
		};

		var meleeAttack = function (attacker, defender) {
			var rawDamage = Math.round(attacker.minAtk + (Math.random() * (attacker.maxAtk - attacker.minAtk)));
			var damageImpact = rawDamage - defender.ac;
			if (damageImpact < 0)
				damageImpact = 0;

			attacker.abilityImpact = damageImpact;
			defender.hp = defender.hp - damageImpact;
		};

		var heal = function (healTarget) {
			var healAmount = Math.round(healTarget.level + (Math.random() * (healTarget.level + 6)));
			if (healAmount < 0)
				healAmount = 0;

			if ((healAmount + healTarget.hp) > healTarget.baseHp)
				healTarget.hp = healTarget.baseHp;
			else
				healTarget.hp += healAmount;
			healTarget.abilityImpact = healAmount;
		};

		this.attack = function (attacker, defender) {
			_logger.logInfo("Battle.attack");

			if (attacker.currentBattleAction == "melee")
				meleeAttack(attacker, defender);
			else if (attacker.currentBattleAction == "heal")
				heal(attacker);
			else {
				_logger.logError("Battle action [" + attacker.currentBattleAction + "] not implemented, reverting to melee attack!");
				meleeAttack(attacker, defender);
			}
		};

		this.getFirstUp = function (playerX, playerY) {
			if (playerX.luck > playerY.luck)
				return playerX;

			return playerY;
		};

		this.getSecondUp = function (playerX, playerY) {
			if (playerX.luck > playerY.luck)
				return playerY;

			return playerX;
		};

		this.battleEnded = function (winner, loser, callback) {			
			_this.battleDTO.status.over = true;

			if (winner.heroId == _this.battleDTO.hero.heroId) {
				_this.battleDTO.status.winner = winner.heroName;
				_this.battleDTO.status.loser = loser.name;
				_logger.logInfo(winner.heroName + " won! and " + loser.name + " lost!");
				_this.heroWon();
			}
			else {
				_this.battleDTO.status.winner = winner.name;
				_this.battleDTO.status.loser = loser.heroName;
				_logger.logInfo(winner.name + " won! and " + loser.heroName + " lost!");
				_this.heroLost((err, heroDTO) => {
					if(err) { Logger.logError(err); callback(err, null); return; }
					callback(null, heroDTO);
				});
			}			
		};

		this.heroWon = function () {
			_logger.logInfo("hero won the battle!");
			_this.battleDTO.hero.xp += _this.battleDTO.mob.xp;
			_this.battleDTO.hero.gold += _this.battleDTO.mob.gold;
			_this.battleDTO.hero.silver += _this.battleDTO.mob.silver;
			_this.battleDTO.hero.copper += _this.battleDTO.mob.copper;

			for (var itemIndex in _this.battleDTO.mob.items)
				_this.battleDTO.hero.items.push(_this.battleDTO.mob.items[itemIndex]);
		};

		this.heroLost = function (callback) {
			_logger.logInfo("hero lost the battle!");
			new Hero(_this.battleDTO.hero).died(_this.battleDTO.mob, (err, heroDTO) => {
				if(err) { Logger.logError(err); callback(err, null); return; }
				callback(null, heroDTO);
			});
		};

		this.regen = function () {
			_this.battleDTO.hero.hp += _this.battleDTO.hero.regen;
			_this.battleDTO.mob.hp += _this.battleDTO.mob.regen;

			if (_this.battleDTO.hero.hp > _this.battleDTO.hero.baseHp)
				_this.battleDTO.hero.hp = _this.battleDTO.hero.baseHp;
			if (_this.battleDTO.mob.hp > _this.battleDTO.mob.baseHp)
				_this.battleDTO.mob.hp = _this.battleDTO.mob.baseHp;
		};

		this.nextRound = function (heroBattleAction, callback) {
			_logger.logInfo("Battle.nextRound");
			_this.battleDTO.hero.currentBattleAction = heroBattleAction;

			if (_this.battleDTO.status.over) {
				_logger.logInfo("battle is over!");
				return;
			}
			else
				_this.battleDTO.round++;

			var firstUp = _this.getFirstUp(_this.battleDTO.hero, _this.battleDTO.mob);
			var secondUp = _this.getSecondUp(_this.battleDTO.hero, _this.battleDTO.mob);

			_this.attack(firstUp, secondUp);

			if (secondUp.hp <= 0) {
				_this.battleEnded(firstUp, secondUp, (err, heroDTO) => {
					if(err) { Logger.logError(err); callback(err, null); return; }
					callback(null, heroDTO);
				});
			}
			else {
				_this.attack(secondUp, firstUp);

				if (firstUp.hp <= 0) {
					_this.battleEnded(secondUp, firstUp, (err, heroDTO) => {
						if(err) { Logger.logError(err); callback(err, null); return; }
						callback(null, heroDTO);
					});
				}
				else {
					_this.regen();
					callback(null, {});
				}
			}

			//_logger.logInfo(JSON.stringify(_this.battleDTO.hero));
			//_logger.logInfo(JSON.stringify(_this.battleDTO.mob));
		};

		this.flee = function (callback) {
			_logger.logInfo("Battle.flee");

			if (_this.status.over) {
				_logger.logInfo("battle is over!");
				return;
			}
			else
				_this.battleDTO.round++;

			var firstUp = _this.getFirstUp(_this.battleDTO.hero, _this.battleDTO.mob);
			var secondUp = _this.getSecondUp(_this.battleDTO.hero, _this.battleDTO.mob);

			_this.attack(firstUp, secondUp);

			if (secondUp.hp <= 0) {
				_this.battleEnded(firstUp, secondUp, (err, heroDTO) => {
					if(err) { Logger.logError(err); callback(err, null); return; }
					callback(null, heroDTO);
				});
			}
			else {
				_this.attack(secondUp, firstUp);

				if (firstUp.hp <= 0) {
					_this.battleEnded(secondUp, firstUp, (err, heroDTO) => {
						if(err) { Logger.logError(err); callback(err, null); return; }
						callback(null, heroDTO);
					});
				}
				else {
					_this.regen();
					callback(null, {});
				}
			}

			//_logger.logInfo(JSON.stringify(_this.battleDTO.hero));
			//_logger.logInfo(JSON.stringify(_this.battleDTO.mob));
		};

		this.construct = function () {
			_logger.logInfo("Battle.construct");
			/*_this.drawB();
			$("#nextR").click(function() { 
				_this.nextR( {aT:"mel"}, {aT:"mel"} ); 
			});*/
		};

		_this.construct();
	}