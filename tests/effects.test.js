
tests.effects = {
	arg_change : async (t)=>{
		let counter = 0;

		const comp = xo.comp(function(args){
			this.useEffect(()=>{
				counter += 1;
			}, [args]);
			return x`<div>comp</div>`;
		});


		tree = xo.render(root, comp());
		await wait(10);
		t.is(counter, 1);

		tree = xo.render(root, comp(), tree);
		await wait(10);
		t.is(counter, 1);

		tree = xo.render(root, comp('foo'), tree);
		await wait(10);
		t.is(counter, 2);

		tree = xo.render(root, comp('foo'), tree);
		await wait(10);
		t.is(counter, 2);
	},



	comp_unmount: async (t)=>{
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
		await wait(10);


		t.is(test, true)
	},

	run_once_on_mount : async (t)=>{
		let counter = 0;

		const comp = xo.comp(function(){
			this.useEffect(()=>{
				counter += 1;
			}, []);
			return x`<div>comp</div>`;
		});

		tree = xo.render(root, comp());
		await wait(10);
		t.is(counter, 1);

		tree = xo.render(root, comp(), tree);
		await wait(10);
		t.is(counter, 1);

		tree = xo.render(root, comp(), tree);
		await wait(10);
		t.is(counter, 1);

		tree = xo.render(root, comp(), tree);
		await wait(10);
		t.is(counter, 1);

		tree = xo.render(root, comp(), tree);
		await wait(10);
		t.is(counter, 1);

	},

	no_args_run_every_render : async (t)=>{
		let counter = 0;

		const comp = xo.comp(function(){
			this.useEffect(()=>{
				counter += 1;
			});
			return x`<div>comp</div>`;
		});

		tree = xo.render(root, comp(12));
		await wait(10);
		t.is(counter, 1);

		tree = xo.render(root, comp(13), tree);
		await wait(10);
		t.is(counter, 2);

		tree = xo.render(root, comp(14), tree);
		await wait(10);
		t.is(counter, 3);

		tree = xo.render(root, comp(15), tree);
		await wait(10);
		t.is(counter, 4);

		tree = xo.render(root, comp(16), tree);
		await wait(10);
		t.is(counter, 5);
	}


}