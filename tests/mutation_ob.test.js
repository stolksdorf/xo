const xo = require('../xo2.js');
const {x, comp, render} = xo;


Number.prototype.reduce = function(func, acc){ for(let idx=0;idx<this;idx++){ acc=func(idx,idx,idx); } return acc };
Number.prototype.each = function(func){ this.reduce(func); };



module.exports = ()=>{

	const target = comp(function(){

		this.useEffect(()=>{
			console.log('mounted!');
			return ()=>{
				console.log('unmounted!');
			}
		});
		return x`<div id='removed'>I should be removed!</div>`;
	})

	const Base = comp(function(){
		this.flip = this.initState(false);

		const handleRemove = ()=>{
			const el = document.getElementById('removed');
			el && el.parentNode.removeChild(el);
		};

		return x`<div onclick=${()=>this.flip = !this.flip}>
			<button onclick=${handleRemove}>remove</button>
			${target()}
			${this.flip ? 'on' : 'off'}
		</div>`;
	});


	Root = render(Base(), Root);

	console.log(Root.xoTmpl);

};