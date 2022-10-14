<template>

	<div id="timer" v-show="showTimer">
		<div ref="timer_element" class="timer_inner"></div>
	</div>
		
</template>

<script>
	export default {
		data() {
			return {				
				showTimer: false
			}
		},
		methods: {
			startTimer(timer){
				let timerEl = this.$refs.timer_element
				this.showTimer = true

				timerEl.style.animationDuration = (timer/1000) + 's';
				timerEl.addEventListener('animationend', () => {
					this.showTimer = false
				});
				timerEl.style.animationPlayState = 'running';				
			}
		}
	}
</script>
