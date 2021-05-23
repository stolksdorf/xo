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
	}
}
