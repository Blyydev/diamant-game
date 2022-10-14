<template>
	<div class="card_board">
		<transition name="sql-fade">
			<div class="header_cards">
				<div v-for="i in diamonds">
					<iconDiamant/>
				</div>
			</div>
		</transition>

		<div id="cards_warp" :class="{fullOpen: mobileOpened}" @click="mobileOpened=!mobileOpened">
			<div class="cards_list_inner">
				<TransitionGroup name="card">
					<div v-for="card in cardsList" :key="card.id" :class="cardClass(card)">
						<div class="value">{{ card.value }}</div>
					</div>
				</TransitionGroup>
			</div>
		</div>
	</div>
</template>

<script>
	import tippy from 'tippy.js';
	import 'tippy.js/dist/tippy.css'; 

	import iconDiamant from '../../assets/svg/diamant.svg'

	export default {
		props: {
			cardsList: Object,
			diamonds: Number
		},
		data() {
			return {
				tippyBoxCave: {},
				mobileOpened: false
			}
		},
		methods: {			
			cardClass(card) {
				let tmpClass = ['card_item', card.name, card.value]
				if(card.name == "tresor"){
					if(card.value > 12)
						tmpClass.push('tresor_l')
					else if (card.value > 6)
						tmpClass.push('tresor_m')
					else
						tmpClass.push('tresor_s')
				}
				return tmpClass
			}
		},
		mounted(){
			this.tippyBoxCave = tippy('.header_cards', {
				placement: 'top-start',
				content: 'Les diamants restant dans la grotte',
			});
		},
		components: {
			iconDiamant
		}
	}
</script>