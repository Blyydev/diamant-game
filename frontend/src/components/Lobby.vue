<template>
	<div class="app_inner" id="lobby_component">

		<div class="title">Diamant</div>
		
		<div class="panel_inner">
			
			<h2>En attente du début de la partie</h2>

			<div class="room_code">
				<div class="rc_inner">
					<span>Code de la partie :</span><strong>{{ gameId }}</strong>
				</div>
			</div>

			<div class="players_list">
				<div v-for="player in orderedPlayers" class="player_item" :class="{ready:player.ready}" :key="player.pseudo">
					<div class="pseudo">{{ player.pseudo }}</div>
				</div>
			</div>

			<div class="ready_btn">
				<button @click.prevent="ImReady" class="start_btn primary_btn">{{ btnLabel }}</button>
			</div>
		</div>

	</div>
</template>

<script>
	// ⭐ 💎
	import _ from 'lodash'
	import $ from "jquery"

	export default {
		props: {
			players: Object,
			gameId: Number,
			socket: Object
		},
		data(){
			return {

			}
		},
		computed: {
			btnLabel: function(){
				// console.log(this.players[this.socket.id])
				if(this.players[this.socket.id].ready)
					return 'Je ne suis pas pret'
				else
					return 'Je suis pret'
			},
			orderedPlayers: function() {
				return _.orderBy(this.players, 'pseudo')
			}
		},
		methods: {
			ImReady(){
				// if(this.players.constructor === Object && Object.keys(this.players).length > 1 )
				this.socket.emit('SET_READY', this.gameId)
			}
		}
	}
</script>

<style lang="less" scoped>
	@import "../assets/css/style-lobby.less";
</style>