<template>
	<div class="app_inner" id="login_component">

		<template v-if="!tryreconnect">

			<div class="title">Diamant</div>

			<div class="panel_login" v-show="step === loginStep.MENU">
				<button @click="step = loginStep.CREATE">Créer une partie</button>
				<button @click="step = loginStep.JOIN">Rejoindre une partie</button>
				<button @click="step = loginStep.SPECTATOR">Spectateur</button>
			</div>

			<form class="form_login panel_inner" v-show="step > 0">
				<input
					v-show="step < 3"
					ref="pseudo"
					type="text"
					placeholder="Pseudo"
					maxlength="15"
					v-model="pseudo"
					autocomplete="false"
					spellcheck="false"
					v-on:keyup.enter="validateForm"
				/>

				<input
					v-show="step != 1"
					ref="roomCode"
					type="text"
					placeholder="Code de la partie"
					maxlength="4"
					v-model="roomCode"
					v-on:keypress="digitOnly($event)"
					v-on:keyup.enter="validateForm"
					autocomplete="false"
					spellcheck="false"
				/>

				<div class="error" v-show="errorMsg.length > 0">{{ errorMsg }}</div>

				<button class="primary_btn create_game_btn" @click.prevent="validateForm">Valider</button>

				<button class="back_login" @click.prevent="backLogin">Retour</button>
			</form>
		</template>

		<div class="loading_login" v-else>
			<h2>CHARGEMENT</h2>
		</div>
		
	</div>
</template>

<script>

	const loginStep = {
		MENU: 0,
		CREATE: 1,
		JOIN: 2,
		SPECTATOR: 3
	}

	export default {
		data() {
			return {
				pseudo: '',
				errorMsg:'',
				roomCode: '',
				step: loginStep.MENU,
				loginStep: loginStep,
			}
		},
		props: {
			tryreconnect: Boolean,
			socket: Object
		},
		computed: {
			formatPseudo: function(){
				return this.pseudo.replace(/[^a-zA-Z0-9]+/g, "-")
			}
		},
		methods: {
			testPseudo() {
				if((this.formatPseudo.length > 2) && (this.formatPseudo.length < 16)){
					this.errorMsg = ""
					return true
				}else{
					if(this.formatPseudo.length < 3) this.errorMsg = "Pseudo trop court :("
					if(this.formatPseudo.length > 15) this.errorMsg = "Pseudo trop long :("
				}
				return false
			},
			testCode(){
				if(this.roomCode.length !== 4){
					if(this.roomCode.length === 0)
						this.errorMsg = "Indiquez un code de partie"
					else
						this.errorMsg = "Indiquez un code de partie valide"
					return false
				}
				return true
			},
			digitOnly(e){
				let char = String.fromCharCode(e.keyCode);
				if(/^[0-9]+$/.test(char)) return true;
				else e.preventDefault();
			},
			validateForm(){
				switch (this.step) {
					case this.loginStep.CREATE:
						this.createRoom()
						break;
				
					case this.loginStep.JOIN:
						this.joinRoom()						
						break;
				
					case this.loginStep.SPECTATOR:
						this.joinScreen()						
						break;
				}
			},
				createRoom() {
					if(!this.testPseudo()) return false
					this.socket.emit('CREATE_NEW_GAME', this.formatPseudo)
				},
				joinRoom() {
					if(!this.testPseudo() || !this.testCode()) return false
					this.socket.emit('JOIN_GAME', this.roomCode, this.formatPseudo)
				},
				joinScreen() {
					if(!this.testCode()) return false
					this.socket.emit('JOIN_GAME_SPECTATOR', this.roomCode)
				},
				backLogin(){
					this.step = loginStep.MENU
					this.errorMsg = ""
				}
		},
		mounted() {
			if(!this.tryreconnect){
				let cookiePseudo = readCookie('diamant_pseudo')
				if(cookiePseudo != null && cookiePseudo){
					this.pseudo = cookiePseudo
				}else{	
					this.$refs.pseudo.focus()
				}
			}			
		}
	}

	// COOKIE functions
		function createCookie(cookiename,value,days){
			if (days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				var expires = "; expires="+date.toGMTString();
			}
			else var expires = "";
			document.cookie = cookiename+"="+value+expires+"; path=/";
		}
		function readCookie(name){
			var nameCoookie = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameCoookie) == 0) return c.substring(nameCoookie.length,c.length);
			}
			return null;
		}
</script>

<style lang="less" scoped>
	@import "../assets/css/style-login.less";
</style>