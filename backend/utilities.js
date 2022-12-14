
module.exports = {
	shuffle : function(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	},
	random: function(max){
		return Math.floor(Math.random() * max);
	},
	randomCode: function(y = 6){
		return Math.random().toString(36).substr(2, y);
	},
	generateID: function(){
		return '_sql_' + this.randomCode(9);
	}
}

