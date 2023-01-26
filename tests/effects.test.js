const {x, comp, render} = xo;

Tests.Effects = {
	arg_change : async (t)=>{
		let counter = 0;

		const comp = xo.comp(function(args){
			this.useEffect(()=>{
				counter += 1;
			}, [args]);
			return x`<div>comp ${args}</div>`;
		});


		Root = xo.render(comp(), Root);
		await t.wait(10);
		t.eq(counter, 1);

		Root = xo.render(comp(), Root);
		await t.wait(10);
		t.eq(counter, 1);

		Root = xo.render(comp('foo'), Root);
		await t.wait(10);
		t.eq(counter, 2);

		Root = xo.render(comp('foo'), Root);
		await t.wait(10);
		t.eq(counter, 2);
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

		Root = xo.render(comp(), Root);
		Root = xo.render(x`<div>yo</div>`, Root);
		await t.wait(10);


		t.eq(test, true)
	},

	run_once_on_mount : async (t)=>{
		let counter = 0;

		const comp = xo.comp(function(){
			this.useEffect(()=>{
				counter += 1;
			});
			return x`<div>comp</div>`;
		});

		Root = xo.render(comp(), Root);
		await t.wait(10);
		t.eq(counter, 1);

		Root = xo.render(comp(), Root);
		await t.wait(10);
		t.eq(counter, 1);

		Root = xo.render(comp(), Root);
		await t.wait(10);
		t.eq(counter, 1);

		Root = xo.render(comp(), Root);
		await t.wait(10);
		t.eq(counter, 1);

		Root = xo.render(comp(), Root);
		await t.wait(10);
		t.eq(counter, 1);

	},

	//TODO: Why do I want this?
	_no_args_run_every_render : async (t)=>{
		let counter = 0;

		const comp = xo.comp(function(){
			this.useEffect(()=>{
				counter += 1;
			});
			return x`<div>comp</div>`;
		});

		Root = xo.render(comp(12), Root);
		await t.wait(10);
		t.eq(counter, 1);

		Root = xo.render(comp(13), Root);
		await t.wait(10);
		t.eq(counter, 2);

		Root = xo.render(comp(14), Root);
		await t.wait(10);
		t.eq(counter, 3);

		Root = xo.render(comp(15), Root);
		await t.wait(10);
		t.eq(counter, 4);

		Root = xo.render(comp(16), Root);
		await t.wait(10);
		t.eq(counter, 5);
	}


}