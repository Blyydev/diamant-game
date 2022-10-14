<template>
	<div class="players_warp">
		<div v-for="player in playersList" class="player_item" :ref="player.id" :class="{'camp': player.in_camp}">
			<div class="player_pseudo">{{ player.pseudo }}</div>
			<div class="status_bar"></div>
		</div>
	</div>
</template>

<script>
	export default {
		props: {
			playersList: Object
		}
	}
</script>
