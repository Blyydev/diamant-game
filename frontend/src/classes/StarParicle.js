export default class{

	constructor(canvasW, canvasH) {
		this.canW = canvasW
		this.canH = canvasH

		this.x = this.canW * Math.random();
		this.y = this.canH * Math.random();

		this.pOpacity = Math.random()
		this.vOp = (Math.random() > .5 ? 0.02 : -0.02)
	}

	Draw(ctx) {
		ctx.fillStyle = 'white';		
		ctx.shadowBlur = 3;
		ctx.shadowColor = "blue";
		ctx.fillRect(this.x, this.y, 2, 2);
		ctx.globalAlpha = this.pOpacity;
	}
	
	Update() {
		this.pOpacity += this.vOp;
	
		if(this.pOpacity < 0){
			this.vOp = 0.02;
			this.pOpacity = 0;
		}

		if(this.pOpacity > 1){
			this.vOp = -0.02;
			this.pOpacity = 1;
		}
	}

}