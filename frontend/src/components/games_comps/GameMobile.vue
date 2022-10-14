<template>

		<transition name="sql-fade">
			<div id="popup_mobile" v-show="showPopup" @click="resetPopup">
				<span v-html="popup"></span>
			</div>
		</transition>

		<header id="header_game">
			<div class="logo">Diamant</div>
			<div class="mobile_menu_btn" @click="showMenu=true">
				<span></span>
				<span></span>
				<span></span>
			</div>
		</header>

		<Timer ref="timer" />
		
		<CardsBoard :cardsList="caveCards" :diamonds="diamondsLeft" />

		<div class="temp_diamants_inner"><iconDiamant/> {{ diamondsTemp }}</div>

		<transition name="sql-fade">
			<ActionBtns v-if="choose" @actionChoice="actionBtnChild"/>
		</transition>

		<transition name="sql-fade">
			<div class="mobile_menu"  v-show="showMenu">
				<div class="back" @click="showMenu = false">&times;</div>

				<div class="menu_inner">

					<div class="round">
						<iconCamp/>
						<span>Grotte n°{{gameRound}}</span>
					</div>

					<div class="diamonds_chest">
						<span>Votre coffre :</span><iconDiamant/> <strong>{{ myDiamonds }}</strong>
					</div>

					<div class="players_list_mobile">
						<PlayersList :players-list="players"/>
					</div>
				</div>
			</div>
		</transition>

</template>

<script>
	import ActionBtns from './_actionBtns.vue'
	import PlayersList from './_playersList.vue'
	import CardsBoard from './_cardsBoard.vue'
	import Timer from './_timer.vue'

	import iconCamp from '../../assets/svg/camp.svg'
	import iconDiamant from '../../assets/svg/diamant.svg'

	export default {
		props: {
			socket: Object,
			players: Object,
			gameId: Number
		},
		data() {
			return {
				showMenu: false,
				caveCards: {},
				gameRound: 1,
				diamondsLeft: 0,
				diamondsTemp: 0,
				choose: false,
				popup: "",
				showPopup: false
			}
		},
		computed: {
			myDiamonds: function(){
				if(this.socket.id in this.players)
					return this.players[this.socket.id].diamants
				else
					return 0
			}
		},
		methods: {
			actionBtnChild(y){
				this.socket.emit('SUBMIT_CHOICE', this.gameId, y)
				this.choose = false
			},
			resetPopup(){
				this.showPopup = false
				setTimeout(() => { this.popup = '' }, 750)
			}
		},
		mounted(){		
			this.socket.on('UPDATE_DATAS', (data) => {
				this.gameRound = data.round
				this.caveCards = data.caveCards
				this.diamondsLeft = data.leftDiamonds
				this.diamondsTemp = data.tempDiamonds

				if(data.choiceOpen
						&& !this.players[this.socket.id].in_camp 
						&& this.players[this.socket.id].last_action === null)
					 	this.choose = true
			})

			this.socket.on('TIMER_START', (time) => {
				this.$refs.timer.startTimer(time)
			})

			this.socket.on('NEW_ROUND', (round) => {
				this.gameRound = round
				this.diamondsLeft = 0
				this.diamondsTemp = 0
			})

			this.socket.on('CAVE_CARDS', (cards) => {
				this.caveCards = cards
			})

			this.socket.on('SECOND_DANGER', (cards) => {
				this.caveCards = cards
				this.diamondsLeft = 0
				this.diamondsTemp = 0
			})

			this.socket.on('CHOOSE_PHASE', (test) => {
				if(test) this.choose = true
			})

			this.socket.on('DIAMOND_LEFT', (diamonds) => {
				this.diamondsLeft = diamonds
			})

			this.socket.on('MESSAGE_POPUP', (data) => {
				this.popup = data.message
				this.showPopup = true

				setTimeout(() => {
					this.resetPopup()
				}, 3500)
			})

		},
		components: {
			ActionBtns, PlayersList, CardsBoard, Timer,
			iconCamp, iconDiamant
		}
	}
</script>
