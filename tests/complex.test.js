const {x, comp, render} = xo;



Tests.$Complex = async (t)=>{
	let mounted = {}, unmounted={};

	const Item = comp(function(id, initTxt){
		this.editable = this.useState(true);
		this.text = this.useState(initTxt);

		this.toggleState = this.useRef(()=>{ this.editable = !this.editable; });
		this.handleChange = this.useRef((evt)=>{
			this.text = evt.target.value;
		});

		this.useEffect(()=>{
			console.log(`--> ${id} mounted`);
			mounted[id] = (mounted[id]??0)+1;
			this.text = initTxt;
			if(id == 'a') this.editable = false;
			return ()=>{
				unmounted[id] = (unmounted[id]??0)+1;
				console.log(`--> ${id} unmounted`);
			}
		});

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

	let baseScope;
	const Base = comp(function(arg){
		this.items = this.useState({
			a : Item('a', 'I am A item'),
			b : Item('b', 'BUt I am the best'),
			c : Item('c', 'c -itemg'),
			d : Item('d', 'doot doot'),
			e : Item('e', 'exceptional'),
		});

		this.itemOrder = this.useState(['a', 'b', 'c']);

		this.reorder = this.useRef(()=>{
			let temp = this.itemOrder.pop();
			this.itemOrder = [temp, ...this.itemOrder];
		});
		this.composition = this.useRef(()=>{
			if(this.itemOrder.length === 3){
				this.itemOrder = ['d', 'a', 'c', 'e'];
			}else{
				this.itemOrder = ['a', 'b', 'c'];
			}
		});
		this.swap = this.useRef(()=>{
			if(this.itemOrder[1] == 'b'){
				this.itemOrder[1] = 'e';
			}else{
				this.itemOrder[1] = 'b';
			}
		});

		// this.useEffect(()=>{
		// 	setTimeout(reorder, 1 * 200);
		// 	//setTimeout(composition, 2 * 200);
		// });

		baseScope = this;
		return x`<div class='base'>
			${this.itemOrder.join(', ')}
			<button onclick=${this.reorder}>re-order</button>
			<button onclick=${this.composition}>change composition</button>
			<button onclick=${this.swap}>swap</button>
			<hr />
			${this.itemOrder.reduce((acc, id)=>{
				acc[id] = this.items[id];
				return acc;
			}, {})}
		</div>`;

	});
	Result = render(Base());

	console.log(mounted)

	console.log(Result.innerHTML)

	await t.wait(50);
	baseScope.swap();
	await t.wait(50);
	console.log(mounted)
}
