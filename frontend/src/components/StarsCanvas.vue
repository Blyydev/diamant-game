<template>
	<canvas id="skycanvas"></canvas>
</template>

<script>

	import StarParicle from "../classes/StarParicle.js";

	export default {
		data() {
			return {
				canvas: null,
				ctx: null,
				particles: [],
				num_particles: 300
			}
		},	
		methods: {
			loopCanvas: function(){
				this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				for (var i = 0; i < this.num_particles; i++) {
					this.particles[i].Update();
					this.particles[i].Draw(this.ctx);
				}
			}
		},
		mounted() {			
			
			this.canvas = document.getElementById("skycanvas");			
			this.ctx = this.canvas.getContext("2d");
			
			this.canvas.width = window.innerWidth;
			// this.canvas.height = window.innerHeight;
			this.canvas.height = 800;

			for (var i = 0; i < this.num_particles; i++)
				this.particles.push(new StarParicle(this.canvas.width, this.canvas.height));
			
			setInterval(() => {
				this.loopCanvas()
			}, 30);

			// this.loopCanvas()

		}
	}
</script>

<style lang="less" scoped>
	@import "../assets/css/init.less";
	
	#skycanvas{
		position: fixed;
		top: -800px;
		left: 0;
		z-index: -1;
		user-select: none;
		pointer-events: none;
		opacity: .75;
		.transition(@bgAnimDuration, top);
	}

	#Login #skycanvas{
		top: 0%;
	}

	@media screen and (max-width: 800px) {
		#Login #skycanvas{
			bottom: 250px;
			top: inherit;
		}
	}
    

</style>