<template>
	
	<div id="popup">
		<transition-group name="popup" tag="div">
		<div v-for="(pop, index) in popup_list" @click="deletePopup(index)" class="pop_item" :key="(index+'_'+item)">
			<span v-html="pop"></span>
		</div>
		</transition-group>
	</div>

	<Timer ref="timer" />

	<header id="header_game">
		<div class="logo">Diamant</div>
		<div class="round" :class="'step_'+gameRound">
			<div v-for="index in maxRound"
				class="step_item"
				:class="'step_'+index"
				:data-current="(gameRound >= index ? (gameRound === index ? true : 'done') : false)"
			><iconCamp/></div>
		</div>
		<div class="diamonds_chest"><iconDiamant/> {{ myDiamonds }}</div>
	</header>

	<CardsBoard :cardsList="caveCards" :diamonds="diamondsLeft" />

	<transition name="sql-fade">
		<ActionBtns  v-if="choose" @actionChoice="actionBtnChild"/>
	</transition>

	<div class="bottom_panel">
		<div class="temp_diamants" v-show="diamondsTemp > 0">
			<div class="temp_diamants_inner"><iconDiamant/> {{ diamondsTemp }}</div>
			<div class="anim_diamond">
				<span :class="{drop: dropAnim}" :style="diamondAnimIteration"><iconDiamant/></span>
			</div>
		</div>

		<PlayersList :players-list="players"/>
	</div>

</template>

<script>
	import tippy from 'tippy.js';
	import 'tippy.js/dist/tippy.css'; 

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
			gameId: Number,
			maxRound: Number
		},
		data() {
			return {
				caveCards: {},
				gameRound: 1,
				maxRound: 5,
				diamondsLeft: 0,
				diamondsTemp: 0,
				choose: false,
				popup_list: [],
				dropAnim: false,
				dropAnimCount: 0,
				tippyBox: {}
			}
		},
		computed: {
			myDiamonds: function(){
				if(this.socket.id in this.players)
					return this.players[this.socket.id].diamants
				else
					return 0
			},
			diamondAnimIteration(){
				if(this.dropAnimCount > 0)
					return 'animation-iteration-count:'+this.dropAnimCount+';'

				return false
			}
		},
		methods: {
			actionBtnChild(y){
				this.socket.emit('SUBMIT_CHOICE', this.gameId, y)
				this.choose = false
			},
			timerAnim(ms){
				return new Promise(res => setTimeout(res, ms))
			},
			async incrementDiamonds(total) {
				let timerMs = 350
				this.dropAnimCount = (total - this.diamondsTemp)
				
				if(total - this.diamondsTemp > 9) timerMs = 200
				this.dropAnim = true

				for (var i = this.diamondsTemp; i <= total; i++) {
					this.diamondsTemp = i
					await this.timerAnim(timerMs);
				}

				this.dropAnim = false
				this.dropAnimCount = 0
			},
			deletePopup(index){
				this.popup_list.splice(index, 1);
			}
		},
		mounted(){
	
			// Tippy.js instances
				this.tippyBox.chest = tippy('.diamonds_chest', {
					content: 'Les diamants dans votre coffre',
				});
				this.tippyBox.cave = tippy('.temp_diamants_inner', {
					content: 'Les diamants par joueur dans la grotte',
				});
				this.tippyBox.round = tippy('.round ', {
					content: 'Tour '+this.gameRound+' sur '+this.maxRound,
				});

			// Socket
				
				this.socket.on('UPDATE_DATAS', (data) => {
					this.maxRound = data.maxRound
					this.gameRound = data.round
					this.caveCards = data.caveCards
					this.diamondsLeft = data.leftDiamonds

					if(data.tempDiamonds > this.diamondsTemp){
						this.incrementDiamonds(data.tempDiamonds)
					}

					if(data.tempDiamonds < this.diamondsTemp)
						this.diamondsTemp = data.tempDiamonds

					if(data.choiceOpen
						&& !this.players[this.socket.id].in_camp 
						&& this.players[this.socket.id].last_action === null)
					 	this.choose = true

				})

				this.socket.on('TIMER_START', (time) => {
					this.$refs.timer.startTimer(time)
				})

				this.socket.on('NEW_ROUND', (round, maxRound) => {
					this.gameRound = round
					this.maxRound = maxRound
					this.diamondsLeft = 0
					this.diamondsTemp = 0

					this.tippyBox.round[0].setContent('Tour '+this.gameRound+' sur '+this.maxRound);
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
					this.popup_list.push(data.message)

					setTimeout(() => {
						if(this.popup_list.length){
							let tmpIndex = this.popup_list.indexOf(data.message)
							this.deletePopup(tmpIndex)
						}
					}, 5500)
				})

		},
		components: {
			ActionBtns, PlayersList, CardsBoard, Timer,
			iconCamp, iconDiamant
		}
	}
</script>