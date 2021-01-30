function AppContext() {

	var _this = this;
	this.PREFIX = "om-hq-";
	this.LOGIN_TABLE_NAME = this.PREFIX+"login";
	this.HERO_TABLE_NAME = this.PREFIX+"hero";
	this.ALLOWED_ORIGINS = ["http://localhost", "http://aws..."];

}

module.exports = new AppContext(); // Singleton