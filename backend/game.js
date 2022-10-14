const utils = require('./utilities.js'),
	  Timer = require('timer.js'),
	  BaseCards = require('./cards.js')

class Game{

	constructor(gameid, admin, io) {
		this.io = io.in(gameid)
		
		// Base Room
		this.gameId = gameid
		this.admin = admin

		// Players
		this.PLAYERS = {}
		this.discoPlayers = {}

		// GAME
		this.maxRound = 5
		this.gameState = 0 // Run (1) or Not (0)
		this.gameRound = 0 // from 1 to maxRound
		this.gameTurn = 0
		this.choiceOpen = false

		// this.gameBaseCards = Cards
		this.gameCards = []
		this.gameCaveCards = {}
		this.gameRemovedCards = []

		this.gameTempDiamonds = 0
		this.gameLeftDiamonds = 0

		// Timers

			this.startGameTimer = new Timer({
				onend : () => { this.startGame() }
			});

			this.nextRoundTimer = new Timer({
				onstart : (sec ) => {
					this.io.emit("TIMER_START", sec);
				},
				onend : () => { this.newRound() }
			});

			this.nextTurnTimer = new Timer({
				onend : () => { this.newTurn() }
			});

			this.disconnectTimer = new Timer( () => {
				onend : () => { this.nextRound() }
			})

	}

	// PLAYERS --------------

		// Connexion
		async connection(pseudo, id){
			this.PLAYERS[id] = {
				id: id,
				ready: false,
				in_camp: true,
				pseudo: pseudo,
				diamants: 0,
				last_action: null // 0 = stay in cave * 1 = back to camp
			};
			await this.updatePlayers();

			this.io.to(id).emit("JOINED_GAME", this.gameId);
		}

		// Screen
		async screenGame(id){
			this.io.to(id).emit("JOINED_SCREEN_GAME", this.gameId);
			this.updateDatas()
			this.updatePlayers()
		}

		setReady(plyrId){
			this.PLAYERS[plyrId].ready = !this.PLAYERS[plyrId].ready
			if(!this.PLAYERS[plyrId].ready) this.startGameTimer.stop();
			this.testReady()
			this.updatePlayers();
		}

		setChoicePlayer(id_player, choice){
			this.PLAYERS[id_player].last_action = choice
			this.testPlays()
		}

		// Reset player's score
		resetScrore(){
			for (let key in this.PLAYERS) {
				this.PLAYERS[key].ready = false
				this.PLAYERS[key].in_camp = true
				this.PLAYERS[key].diamants = 0
				this.PLAYERS[key].last_action = null
			}
		}

		// Disconnection
		async disconnect(playerId){
			if(playerId in this.PLAYERS){
				// If game is running copy player in Disconnect array
				if(this.gameState === 1) this.discoPlayers[playerId] = this.PLAYERS[playerId]

				delete this.PLAYERS[playerId]

				// Update info
				await this.updatePlayers()
			}
		}

		// Reconnection
		async reconnection(socketId, previousId){
			this.PLAYERS[socketId] = this.discoPlayers[previousId]
			this.PLAYERS[socketId].id = socketId

			// remove in disconnect players list
			delete this.discoPlayers[previousId];

			setTimeout(() => {
				this.updateDatas()
			}, 250)

			await this.updatePlayers()
		}

	// UPDATE DATA

		// [emit] Updated data of Players
		async updatePlayers(){
			return await new Promise(resolve => {
				this.io.emit('UPDATE_PLAYERS', this.PLAYERS);
				resolve()
			})
		}

		updateDatas(){
			this.io.emit('UPDATE_DATAS', {
				maxRound: this.maxRound,
				round: this.gameRound,
				caveCards: this.gameCaveCards,
				leftDiamonds: this.gameLeftDiamonds,
				tempDiamonds: this.gameTempDiamonds,
				choiceOpen: this.choiceOpen
			});
		}

		send_message(msg, type = 1){
			this.io.emit('MESSAGE_POPUP', {
				message: msg,
				type: type
			})
		}

	// GAME --------------

		testReady(){
			if(this.gameState > 0) return false

			if( Object.keys(this.PLAYERS).length > 1){
				for(let x in this.PLAYERS){
					if(!this.PLAYERS[x].ready) return false;
				}

				this.startGameTimer.start(3);
			}
		}

		startGame(){
			this.io.emit('START_GAME', this.maxRound);

			this.gameState = 1

			// init Cards
			this.buildDeck()

			// Init vars
			this.gameRound = 0

			this.newRound()
		}

			buildDeck(){
				this.gameCards = []
				for (let c in BaseCards){
					if( BaseCards[c].type !== 1) this.gameCards.push(c)
				}
			}

		// ROUND / MANCHE (= grotte /5)
		newRound(){
			this.gameRound++
			if(this.gameRound > this.maxRound) return this.endGame()

			this.io.emit('NEW_ROUND', this.gameRound, this.maxRound);

			// POP-UP Message
			this.send_message("L'exploration numéro "+this.gameRound+" commence.")

			// Update Cards Deck
			this.updateDeck()

			// Reset Players Temp Score
			this.gameTempDiamonds = 0

			// Move all players in Cave
			for(let x in this.PLAYERS) this.PLAYERS[x].in_camp = false

			this.gameTurn = -1

			this.updatePlayers();
			this.updateDatas();

			// Timer for newTurn()
			this.nextTurnTimer.start(3);
		}

			updateDeck(){
				// Remove card from Deck (2nd danger and relics)
				for(let k of this.gameRemovedCards) {
					let index = this.gameCards.indexOf(k);
					if (index !== -1) this.gameCards.splice(index, 1);
				}

				// Add relique & Shuffle Deck
				this.gameCards.push('c_relique_'+this.gameRound)

				// Shuffle Deck
				this.gameCards = utils.shuffle(this.gameCards)

				this.gameRemovedCards = []
				this.gameCaveCards = {}
				this.gameLeftDiamonds = 0
			}

		// TURN / TOUR (= carte dans la grotte)
		async newTurn(){
			this.gameTurn++

			// Draw Card
			let newIdCard = this.gameCards[this.gameTurn]
			let tmpNewCard = BaseCards[newIdCard]

			this.gameCaveCards[newIdCard] = BaseCards[newIdCard]

			// Resolve card - promise w/ 1.5s delay
			let resolveCard = await this.resolveCard(tmpNewCard)

			this.decisionPhase(resolveCard)

			// send new card to players
			this.io.emit('CAVE_CARDS', this.gameCaveCards)

			this.updatePlayers();
		}

			resolveCard(card){
				return new Promise(resolve => {
					setTimeout(() => { // Wait 2s

						// RELIQUE ---
						if(card.type === 1) this.gameRemovedCards.push(card.id)

						// TRESOR ---
						if(card.type === 2){

							// Share Diamonds and keep remainings diamonds
							let numberPlayers = Object.entries(this.PLAYERS).filter(([key, value]) => value.in_camp === false).length;

							this.gameTempDiamonds += Math.floor(card.value / numberPlayers)
							this.gameLeftDiamonds += Math.max(0, (card.value % numberPlayers))
						}

						// DANGER
						if(card.type === 3){
							// test if this is the second danger of thsi kind
							let testDanger = 0
							for (let c in this.gameCaveCards){
								if(this.gameCaveCards[c].value === card.value) testDanger++
							}
							if(testDanger > 1) return this.secondDangerCard(card)
						}

						this.updateDatas()
						
						// Return for Promise - IF not 2nd Danger
						resolve(true)
					}, 2000);
				});
			}

			secondDangerCard(card){
				this.io.emit('SECOND_DANGER', this.gameCaveCards)
				// Remove Second card from the deck
				this.gameRemovedCards.push(card.id)

				// POP-UP Message
				const tmpMsg = "C'est la deuxième carte \""+card.label+"\" piochée : les joueurs encore dans le temple perdent leurs pierres précieuses et la carte est retirée du jeu.";
				this.send_message(tmpMsg, 2)

				// End of Turn
				this.endOfTurn()
			}

			decisionPhase(){
				// wait and let people choose
				setTimeout(() => {
					this.choiceOpen = true
					for (let p in this.PLAYERS){
						this.PLAYERS[p].last_action = null
						if(!this.PLAYERS[p].in_camp)
							this.io.to(this.PLAYERS[p].id).emit('CHOOSE_PHASE', true)
					}
				}, 1500)
			}

			// Test if all players have played - then resolve turn
			testPlays(){
				for (let x in this.PLAYERS){
					if(!this.PLAYERS[x].in_camp && this.PLAYERS[x].last_action === null)
						return false
				}

				this.choiceOpen = false

				// Wait 1.2s before resolve
				setTimeout(() => {
					this.resolveBackToCamp()
				}, 1250)
			}

			resolveBackToCamp(){
				// Change stats in this.PLAYERS
				// add temp Diamants to Stock Diamants

				let peopleInCave = 0,
					playersBackToCamp = []

				// Check who Continue and who Come back
				// Add Diamonds to chest if come back
				for (let x in this.PLAYERS){

					if(this.PLAYERS[x].in_camp) continue

					// If come back to camp
					if(this.PLAYERS[x].last_action === 1){

						this.PLAYERS[x].in_camp = true
						playersBackToCamp.push(this.PLAYERS[x].id)

						this.PLAYERS[x].diamants += this.gameTempDiamonds
						// this.PLAYERS[x].diamants += this.PLAYERS[x].temp_diamants
						// this.PLAYERS[x].temp_diamants = 0

					// If continue exploration
					}else if(this.PLAYERS[x].last_action === 0){
						peopleInCave++
					}
				}

				// IF ONLY ONE player come back to Camp - test Relique
				if(playersBackToCamp.length === 1){
					let playerId = playersBackToCamp[0]

					// if there is a RELIQUE - Get Diamants and remove card from Cave
					for(let y in this.gameCaveCards) {
						if(this.gameCaveCards[y].type === 1){
							this.PLAYERS[playerId].diamants += this.gameCaveCards[y].value
							delete this.gameCaveCards[y]
							this.io.emit('CAVE_CARDS', this.gameCaveCards)
						}
					}

					// He takes all remainings diamonds
					this.PLAYERS[playerId].diamants += this.gameLeftDiamonds
					this.gameLeftDiamonds = 0

				// IF MULTIPLE Players come back to Camp
				}else if(playersBackToCamp.length > 1){

					// Share diamonds
					let diamondsByPlayer = Math.floor(this.gameLeftDiamonds / playersBackToCamp.length)
					for (let k of playersBackToCamp) this.players[k].diamants += diamondsByPlayer

					// Remaining Diamonds after sharing
					this.gameLeftDiamonds = Math.max(0, (this.gameLeftDiamonds % playersBackToCamp.length));
				}

				this.updatePlayers();

				//////////////////////

				// If still player(s) in Cave : continue
				if(peopleInCave > 0){

					// POP-UP Message
					let tmpMsg = "Personne ne rentre au camp."
					if(playersBackToCamp.length === 1){
						tmpMsg = this.PLAYERS[playersBackToCamp[0]].pseudo + " rentre au campement. <br/> Les autres poursuivent l'exploration"

					}else if(playersBackToCamp.length > 1){
						let pseudoBackCamp = []
						for(let x of playersBackToCamp) pseudoBackCamp.push(this.PLAYERS[x].pseudo)
						tmpMsg = pseudoBackCamp.join(', ')+" rentrent au campement. <br/> Les autres poursuivent l'exploration"
					}
					this.send_message(tmpMsg)


					this.nextTurnTimer.start(3);

				// Else : end of round !
				}else{

					// POP-UP Message
					let tmpMsg = 'Tous les explorateurs sont rentrés au campement.'
					this.send_message(tmpMsg)

					// End of Turn
					this.endOfTurn()
				}

				this.updateDatas()
			}

			endOfTurn(){
				setTimeout(() => {
					this.gameCaveCards = {}
					this.gameTempDiamonds = 0
					this.gameLeftDiamonds = 0
					this.updateDatas()
				}, 3000)

				// End turn
				this.nextRoundTimer.start(6)
			}

		endGame(){
			// END GAME - show ScoreBoard
			this.updatePlayers();
			this.io.emit('END_GAME')

			setTimeout(() => {
				this.resetGame()
			}, 2500)
		}

	// DESTROY test

		testDestroy(){
			if(Object.keys(this.PLAYERS).length === 0 && this.PLAYERS.constructor === Object){
				return true
			}else{
				return false
			}
		}

	// Reset Datas
	
		resetGame(){
			this.resetScrore()
			// Players
			this.discoPlayers = {}

			// GAME
			this.gameState = 0
			this.gameRound = 0
			this.gameTurn = 0
			this.choiceOpen = false

			this.gameCards = []
			this.gameCaveCards = {}
			this.gameRemovedCards = []
			this.gameTempDiamonds = 0
			this.gameLeftDiamonds = 0

			this.updateDatas()
			this.updatePlayers()
		}

}

module.exports = Game