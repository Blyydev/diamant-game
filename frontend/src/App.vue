<template>
	<div class="app_wrapper" :id="currentView.component">

		<StarsCanvas/>

		<transition name="sql-fade">
			<component
				:is="currentView.component"
				v-bind="currentView.props"
				v-on="currentView.events"
				:key="currentView.component"
				:ref="currentView.component"
			></component>
		</transition>

	</div>
</template>

<script>
	import Login from './components/Login.vue'
	import Lobby from './components/Lobby.vue'
	import Game from './components/Game.vue'
	import Screen from './components/Screen.vue'
	import Scoreboard from './components/Scoreboard.vue'
	import StarsCanvas from './components/StarsCanvas.vue'

	import { io } from 'socket.io-client'

	const gameState = {
		LOGIN: 0,
		LOBBY: 1,
		RUNNING: 2,
		END_SCORE: 3,
		SPECTATOR: 4
	}

	export default {
		data() {
			return {
				socket : null,
				logged : false,
				reconnect: false,
				state : gameState.LOGIN,
				players : {},
				gameId : null
			}
		},
		computed: {
			currentView: function(){
				if(this.logged){
					if(this.state === gameState.LOBBY){
						return {
							component: 'Lobby',
							props: {
								players: this.players,
								gameId: this.gameId,
								socket: this.socket
							},
							events: {}
						}
					}
					if(this.state === gameState.RUNNING){
						return {
							component: 'Game',
							props: {
								players: this.players,
								socket: this.socket,
								gameId: this.gameId
							},
							events: {}
						}
					}
					if(this.state === gameState.SPECTATOR){
						return {
							component: 'Screen',
							props: {
								players: this.players,
								socket: this.socket,
								gameId: this.gameId
							},
							events: {}
						}
					}
					if(this.state === gameState.END_SCORE){
						return {
							component: 'Scoreboard',
							props: {
								players: this.players,
								socket: this.socket,
							},
							events: {
								backfnct: this.returnToLobby
							}
						}
					}
				}else{
					return {
						component: 'Login',
						props: {
							socket: this.socket,
							tryreconnect: this.reconnect
						},
						events: {}
					}
				}
			}			
		},
		methods: {
			async connectSocket(){
				return await new Promise(resolve => {
					// ~ DEV
					if(import.meta.env.MODE === "development" ){
						this.socket = io('localhost:8084/', {
							"force new connection" : true,
							"reconnectionAttempts": "Infinity",
							"timeout" : 10000,
							"transports" : ["websocket"]
						})
					}
					// ~ BUILD
					if(import.meta.env.MODE === "production" ){
						this.socket = io.connect('/', {
							forceNew:true,
							reconnection: true,
							reconnectionDelay: 500,
							reconnectionDelayMax : 5000,
							reconnectionAttempts: 99999
						});
					}
					this.socket.on('connect', () => {
						this.setSockets()
						resolve()
					})
				})
			},
			async setSockets(){
				return await new Promise(resolve => {

					this.socket.on('JOINED_GAME', (gameId) => {
						this.joiningGame(gameId)
					})

					this.socket.on('JOINED_SCREEN_GAME', (gameId) => {
						this.joiningGame(gameId, true)
					})

					this.socket.on('GAME_IS_RUNNING', () => {
						this.$refs.Login.errorMsg = "La partie est déjà en cours !"
					})

					this.socket.on('GAME_NOT_FOUND', () => {
						this.$refs.Login.errorMsg = "La partie est introuvable."
					})

					this.socket.on('UPDATE_PLAYERS', (players) => {
						this.players = players
					})

					this.socket.on('START_GAME', () => {
						if(this.state === gameState.LOBBY ) this.state = gameState.RUNNING
					})

					this.socket.on('END_GAME', () => {
						this.state = gameState.END_SCORE
					})

					this.socket.onAny(() => {
						setTimeout(() => { this.setTitle() }, 150)
					})

					this.socket.on('RECONNECT_PLAYER', (test, gameId) => {
						this.reconnect = false
						eraseCookie()

						if(test){
							this.joiningGame(gameId)
							this.state = gameState.RUNNING
						}else{
							console.log('reconnection FAILED')
						}
					})

					resolve()
				})
			},
			joiningGame(gameId, spectator = false){
				this.gameId = gameId
				this.logged = true

				if(spectator){
					this.state = gameState.SPECTATOR
				}else{
					this.state = gameState.LOBBY
					let cookieV = this.socket.id + '___' + gameId
					createCookie(cookieV, 1)
				}
			},
			returnToLobby(){
				this.state = gameState.LOBBY
			},
			setTitle(){
				let tmpTitle = 'Diamant 💎'
				switch(this.state){
					case 0:
						tmpTitle = 'Diamant 💎'
						break
					case 1:
						tmpTitle = 'En attente des autres joueurs 💎 Diamant'
						break
					case 2:
						tmpTitle = 'Partie en cours 💎 Diamant'
						break
						break
					case 4:
						tmpTitle = 'Spectateur 💎 Diamant'
						break
					case 3:
						tmpTitle = 'Fin de la partie 🏆 Diamant'
						break
				}
				document.title = tmpTitle
			},
		},
		async created(){
			this.setTitle()
			await this.connectSocket()

			// Check Cookie for Reconnection
			let cookieUser = readCookie()
			if(cookieUser != null && cookieUser != ''){
				this.reconnect = true
				this.socket.emit('PLAYER_RECONNECTION', cookieUser)
			}
		},
		components: {
			Login, Lobby, Game, Screen, Scoreboard, StarsCanvas
		},
		inject: ['globalTest']
	}

	// COOKIE functions

		function createCookie(value, erase = false){
			var date = new Date();
			date.setTime(date.getTime()+(1*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
			if(erase) expires = "";
			document.cookie = "diamant_user="+value+expires+"; path=/";
		}
	
		function readCookie(){
			var nameEQ = "diamant_user=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		}

		function eraseCookie(){
			createCookie("", true);
		}
</script>

<style lang="less">
	@import "assets/css/base.less";
</style>
