x = window.x;
tests.effects = {
	_basic : (t)=>{
		throw 'plz implement'
	},

	arg_change : (t)=>{
		let counter = 0;

		const comp = xo.comp(function(args){
			this.useEffect(()=>{
				counter += 1;
			}, [args]);
			return x`<div>comp</div>`;
		});


		tree = xo.render(root, comp());
		t.is(counter, 1);

		tree = xo.render(root, comp(), tree);
		t.is(counter, 1);

		tree = xo.render(root, comp('foo'), tree);
		t.is(counter, 2);

		tree = xo.render(root, comp('foo'), tree);
		t.is(counter, 2);
	},



	comp_unmount: (t)=>{
		// should trigger a unmount

		let test = false;

		const comp = xo.comp(function(){
			this.useEffect(()=>{
				return ()=>test=true
			})
			return x`<div>comp</div>`;
		});

		tree = xo.render(root, comp());
		tree = xo.render(root, x`<div>yo</div>`, tree);

		t.is(test, true)
	},

	run_once_on_mount : (t)=>{
		let counter = 0;

		const comp = xo.comp(function(){
			this.useEffect(()=>{
				counter += 1;
			}, []);
			return x`<div>comp</div>`;
		});

		tree = xo.render(root, comp());
		t.is(counter, 1);
		tree = xo.render(root, comp(), tree);
		t.is(counter, 1);
		tree = xo.render(root, comp(), tree);
		t.is(counter, 1);
		tree = xo.render(root, comp(), tree);
		t.is(counter, 1);
		tree = xo.render(root, comp(), tree);
		t.is(counter, 1);
	}

}