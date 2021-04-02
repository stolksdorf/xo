
tests.list = {


	key_based : {

		basic : (t)=>{
			let tree = xo.render(root, {
				a : 0,
				b : 1,
				c : 2,
			})

			t.is(tree.children['a'].val, 0);
			t.is(tree.children['b'].val, 1);
			t.is(tree.children['c'].val, 2);
		},

		redraw : (t)=>{
			let counter = { a:0,b:0,c:0 };
			let unmount = {}, mount = {};
			const temp = xo.comp(function(id){
				counter[id]+=1
				this.useEffect(()=>{
					mount[id]=true;
					return ()=>unmount[id]=true;
				})
				return id;
			});

			let tree = xo.render(root, {
				a : temp('a', true),
				b : temp('b', true),
				c : temp('c', true),
			});

			tree = xo.render(root, {
				a : temp('a', false),
				b : temp('b', true),
				c : temp('c', false),
			}, tree);


			t.is(mount, {a:true,b:true,c:true});
			t.is(unmount, {a:true,c:true});

			t.is(counter, {a:2,b:1,c:2});
			t.is(tree.el.innerHTML, 'abc');
		},

		order_change : (t)=>{
			let counter = { a:0,b:0,c:0 };
			let unmount = {}, mount = {};
			const temp = xo.comp(function(id){
				counter[id]+=1
				this.useEffect(()=>{
					mount[id]=true;
					return ()=>unmount[id]=true;
				})
				return id;
			});

			let tree = xo.render(root, {
				a : temp('a', true),
				b : temp('b', true),
				c : temp('c', true),
			});

			t.is(tree.el.innerHTML, 'abc');

			tree = xo.render(root, {
				a : temp('a', true),
				c : temp('c', true),
				b : temp('b', true),
			}, tree);



			t.is(mount, {a:true,b:true,c:true});
			t.is(unmount, {});

			t.is(counter, {a:1,b:1,c:1});
			t.is(tree.el.innerHTML, 'acb');
		},

		new_item : (t)=>{
			let counter = { a:0,b:0,c:0 };
			let unmount = {}, mount = {};
			const temp = xo.comp(function(id){
				counter[id]+=1
				this.useEffect(()=>{
					mount[id]=true;
					return ()=>unmount[id]=true;
				})
				return id;
			});

			let tree = xo.render(root, {
				a : temp('a', true),
				c : temp('c', true),
			});

			tree = xo.render(root, {
				a : temp('a', true),
				b : temp('b', false),
				c : temp('c', true),
			}, tree);


			t.is(mount, {a:true,b:true,c:true});
			t.is(unmount, {});

			t.is(counter, {a:1,b:1,c:1});
			t.is(tree.el.innerHTML, 'abc')
		},

		remove_item: (t)=>{
			let counter = { a:0,b:0,c:0 };
			let unmount = {}, mount = {};
			const temp = xo.comp(function(id){
				counter[id]+=1
				this.useEffect(()=>{
					mount[id]=true;
					return ()=>unmount[id]=true;
				})
				return id;
			});

			let tree = xo.render(root, {
				a : temp('a', true),
				b : temp('b', true),
				c : temp('c', true),
			});

			tree = xo.render(root, {
				b : temp('b', true),
			}, tree);


			t.is(mount, {a:true,b:true,c:true});
			t.is(unmount, {a:true,c:true});

			t.is(counter, {a:1,b:1,c:1});
			t.is(tree.el.innerHTML, 'b')
		},

		$complex : (t)=>{
			let render = { a:0,b:0,c:0,f:0,e:0 };
			let unmount = { a:0,b:0,c:0,f:0,e:0 };
			let mount = { a:0,b:0,c:0,f:0,e:0 };
			const temp = xo.comp(function(id){
				render[id]+=1
				this.useEffect(()=>{
					mount[id]+=1
					return ()=>unmount[id]+=1;
				})
				return id;
			});

			let tree = xo.render(root, {
				a : temp('a', true),
				b : temp('b', true),
				c : temp('c', true),
			});

			tree = xo.render(root, {
				c : temp('c', true),
				f : temp('f', true),
				e : temp('e', true),
				b : temp('b', true),
			}, tree);

			console.log('BEGIN', root.childNodes.length)

			// let tree = xo.render(root, {
			// 	a : x`<div>a</div>`,
			// 	b : x`<div>b</div>`,
			// 	c : x`<div>c</div>`,
			// });

			// tree = xo.render(root, {
			// 	c : x`<div>c</div>`,
			// 	f : x`<div>f</div>`,
			// 	e : x`<div>e</div>`,
			// 	b : x`<div>b</div>`,
			// }, tree);




			console.log('-----------')
			console.log('render', render);
			console.log('unmount', unmount);
			console.log('mount', mount);


			console.log('html', tree.el.innerHTML)

			// t.is(mount, {a:true,b:true,c:true});
			// t.is(unmount, {a:true,c:true});

			// t.is(counter, {a:1,b:1,c:1});
			// t.is(tree.el.innerHTML, 'b')

			// verify child key order

			console.log('key order', Object.keys(tree.children))
		}
	},

	array_based : {
		basic : (t)=>{
			let tree = xo.render(root, [
				1,2,3
			])

			t.is(tree.type, 'list');

			t.is(tree.children[0].val, 1);
			t.is(tree.children[1].val, 2);
			t.is(tree.children[2].val, 3);
		},

	},

	reflow : {
		no_change : (t)=>{
			let blurCount = 0;

			const update = ()=>blurCount++;

			const foo = ()=>{
				console.log('running')
				return x`<input type='text' autofocus onblur=${update}></input>`
			}


			let tree = xo.render(root, [
				foo(),
				foo(),
				foo()
			]);

			console.log('BLUR COUNT', blurCount)
			//console.log(tree.children[0].el.focus())


			tree = xo.render(root, [
				foo(),
				foo(),
				foo()
			], tree);
			console.log('BLUR COUNT', blurCount)
		}
	}

}