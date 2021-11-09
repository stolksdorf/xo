
const wait = async (n,val)=>new Promise((r)=>setTimeout(()=>r(val), n));

tests.state = {
	init_val : (t)=>{
		let test;
		const comp = xo.comp(function(){
			const [foo, setFoo] = this.useState('okay there bud');
			test=foo;
		});
		xo.render(root, comp());
		t.is(test, 'okay there bud')
	},
	func_init : (t)=>{
		let test;
		const comp = xo.comp(function(arg){
			const [foo, setFoo] = this.useState(()=>arg+'!');
			test=foo;
		});
		xo.render(root, comp('init func'));
		t.is(test, 'init func!');
	},
	rerenders : {
		no_change : (t)=>{
			let renderCount = 0;
			const comp = xo.comp(function(){
				const [foo, setFoo] = this.useState(true);
				renderCount += 1;
				return x`<div></div>`
			});
			tree = xo.render(root, comp());
			xo.render(root, comp(), tree);
			t.is(renderCount, 1)
		},
		same_val : (t)=>{
			let renderCount = 0;
			const comp = xo.comp(function(){
				const [foo, setFoo] = this.useState(true);
				this.useEffect(()=>{
					setFoo(true);
				},[])
				renderCount += 1;
				return x`<div></div>`
			});
			tree = xo.render(root, comp());
			t.is(renderCount, 1);
			xo.render(root, comp(), tree);
			t.is(renderCount, 1)
		},
		diff_val : (t)=>{
			let renderCount = 0;
			const comp = xo.comp(function(){
				const [foo, setFoo] = this.useState(true);
				this.useEffect(()=>{
					setFoo(false);
				},[])
				renderCount += 1;
				return x`<div></div>`
			});
			tree = xo.render(root, comp());
			xo.render(root, comp(), tree);
			t.is(renderCount, 2)
		},
		forced : (t)=>{
			let renderCount = 0;
			const comp = xo.comp(function(useForced=false){
				const [foo, setFoo] = this.useState(true);
				this.useEffect(()=>{
					setFoo(true, useForced);
				},[])
				renderCount += 1;
				return x`<div></div>`
			});
			tree = xo.render(root, comp());
			t.is(renderCount, 1);
			xo.render(root, comp(), tree);
			t.is(renderCount, 1);
			xo.render(root, comp(true), tree);
			t.is(renderCount, 2);
		},
	},
	with_effects : {
		effect_changing_state : async (t)=>{
			let subscribeFn;

			const update = async (val)=>{
				subscribeFn(val);
				await wait(10);
			}

			let renderCount = 0, lastVal;
			const comp = xo.comp(function(){
				const [val, setVal] = this.useState(0);
				this.useEffect(()=>{
					subscribeFn = (newVal)=>{
						setVal(newVal)
					}
				},[]);

				renderCount += 1;
				lastVal = val;
				return x`<div>${val}</div>`
			});
			tree = xo.render(root, comp());


			t.is(renderCount, 1);
			t.is(lastVal, 0);

			await update(13);
			t.is(renderCount, 2);
			t.is(lastVal, 13);

			await update(-42);
			t.is(renderCount, 3);
			t.is(lastVal, -42);
		}
	}
}
