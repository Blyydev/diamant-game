<template>
	<div class="app_inner" id="scoreboard_component">

		<h3>Tableau de Score</h3>
		<div class="scoreboard_inner">
			<div v-for="(item, index) in rankedPlayers"
				class="p_item" :class="podiumClass(item.rank, item.id)"
			>
				<div class="pseudo">{{ item.pseudo }}</div>
				<div class="score">{{ item.score }}</div>
			</div>
		</div>

		<div class="btn_warp">
			<button @click="backtoLobby" class="btn_backLobby">Retour au lobby</button>
		</div>

	</div>
</template>

<script>
	import _orderBy from 'lodash/orderBy';

	export default {
		data() {
			return {
				playersScoreboard: {}
			}
		},
		props: {
			socket: Object,
			players: Object
		},
		computed: {
			playerByScore: function(){
				return _orderBy(this.playersScoreboard, 'diamants', 'desc');
			},
			rankedPlayers: function() {
				let newArr = [],
					tmpRank = 0,
					previousScore = 999999

				for(let k in this.playerByScore){					
					if(previousScore > this.playerByScore[k].diamants) tmpRank++
					newArr.push({
						id: this.playerByScore[k].id,
						pseudo: this.playerByScore[k].pseudo,
						score: this.playerByScore[k].diamants,
						rank: tmpRank
					})
		
					previousScore = this.playerByScore[k].diamants				
				}

				return newArr
			},
			
		},
		methods: {
			podiumClass(index, id){
				let classes = ['p_'+index]
				if(id === this.socket.id) classes.push('me')
				return classes
			},
			backtoLobby(){
				this.$emit('backfnct');
			}
		},
		mounted(){
			this.playersScoreboard = this.players
		},
		emits: ["backfnct"]
	}
</script>

<style lang="less" scoped>
	@import "../assets/css/style-scoreboard.less";
</style>