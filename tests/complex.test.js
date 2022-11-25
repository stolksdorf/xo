const xo = require('../xo2.js');
const {x, comp, render} = xo;


Number.prototype.reduce = function(func, acc){ for(let idx=0;idx<this;idx++){ acc=func(idx,idx,idx); } return acc };
Number.prototype.each = function(func){ this.reduce(func); };



module.exports = ()=>{


	const Item = comp(function(id, initTxt){
		this.editable = this.init(true);
		this.text = this.init('');


		this.toggleState = this.memo(()=>{ this.editable = !this.editable; });
		this.handleChange = this.memo((evt)=>{
			this.text = evt.target.value;
		});


		this.useEffect(()=>{
			console.log(`--> ${id} mounted`);
			this.text = initTxt;
			if(id == 'a') this.editable = false;
			return ()=>{
				console.log(`--> ${id} unmounted`);
			}
		});

		this.useEffect(()=>{
			//console.log(`--> ${id} changed!?`);
		}, [id]);


		if(this.editable === false){
			return x`<div id=${id} onclick=${this.toggleState}>
				${id}: <em>${this.text}</em>
			</div>`;
		}

		return x`<div id=${id}>
			<textarea value=${this.text} oninput=${this.handleChange}></textarea>
			<button onclick=${this.toggleState}>save</button>
			<span>${this.text}</span>
		</div>`;
	})






	//TODO: weird bug when a component is a direct-only child of another ocmponent
	const Base = comp(function(){

		this.items = this.init({
			a : Item('a', 'I am A item'),
			b : Item('b', 'BUt I am the best'),
			c : Item('c', 'c -itemg'),
			d : Item('d', 'doot doot'),
			e : Item('e', 'exceptional'),
		});

		this.itemOrder = this.init(['a', 'b', 'c']);

		const reorder = ()=>{
			let temp = this.itemOrder.pop();
			this.itemOrder = [temp, ...this.itemOrder];
		};

		const composition = ()=>{
			if(this.itemOrder.length === 3){
				this.itemOrder = ['d', 'a', 'c', 'e'];
			}else{
				this.itemOrder = ['a', 'b', 'c'];
			}
		};

		const swap = ()=>{
			if(this.itemOrder[1] == 'b'){
				this.itemOrder[1] = 'e';
			}else{
				this.itemOrder[1] = 'b';
			}
		}

		this.useEffect(()=>{
			//setTimeout(composition, 1 * 200);
			//setTimeout(composition, 2 * 200);
		});



		return x`<div class='base'>
			${this.itemOrder.join(', ')}
			<button onclick=${reorder}>re-order</button>
			<button onclick=${composition}>change composition</button>
			<button onclick=${swap}>swap</button>
			<hr />


			${this.itemOrder.reduce((acc, id)=>{
				acc[id] = this.items[id];
				return acc;
			}, {})}

		</div>`;

	});

	console.log(Base())




	Root = render(Base(), Root);

};