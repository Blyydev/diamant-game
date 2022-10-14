<template>
	<div class="app_inner" id="game_component" :class="{'mobile_game': isMobile}">
		<MobileGame v-if="isMobile" v-bind="propsToChild"/>
		<DesktopGame v-else v-bind="propsToChild" />
	</div>
</template>

<script>
	import MobileGame from './games_comps/GameMobile.vue'
	import DesktopGame from './games_comps/GameDesktop.vue'

	export default {
		props: {
			socket: Object,
			players: Object,
			gameId: Number,
		},
		computed: {
			isMobile(){
				if( window.innerWidth < 800 ){
					return true
				}else{
					return false				
				}
			},
			propsToChild(){
				return {
					socket: this.socket,
					players: this.players,
					gameId: this.gameId
				}
			}
		},
		methods: {
		},
		mounted(){
		},
		components: {
			MobileGame, DesktopGame
		}
	}
</script>

<style lang="less">
	@import "../assets/css/style-game.less";
</style>