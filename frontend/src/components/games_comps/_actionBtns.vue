<template>
	<div id="actions_warp">
		<button @click.prevent="action_choice(1)" class="btn_action_back primary_btn">Rentrer au camp</button>
		<span class="separator"></span>
		<button @click.prevent="action_choice(0)" class="btn_action_continue primary_btn">Continuer l'exploration</button>
	</div>
</template>

<script>
	export default {
		methods: {
			action_choice(y){
				this.$emit('actionChoice', y);
			}
		},
		emits: ["actionChoice"],
	}
</script>
