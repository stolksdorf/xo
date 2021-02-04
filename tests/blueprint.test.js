x = window.x;
tests.blueprints = {

	basic : {
		render : (t)=>{
			tree = xo.render(root, window.x`<div>test</div>`);
			t.is(tree.el.outerHTML, '<div>test</div>')
		},

		slot : (t)=>{
			tree = xo.render(root, window.x`<div>${'test!'}</div>`);
			t.is(tree.el.outerHTML, '<div>test!</div>');
			t.is(tree.children[0].val, 'test!');
			t.is(tree.children[0].attr, 'innerHTML');
		},

		lib : (t)=>{
			tree = xo.render(root, window.x`<div>${'test!'}</div>`);

			let lib = Library[tree.key]
			t.is(lib.dom.outerHTML, '<div></div>')
			t.is(lib.slots.length, 1)
			t.is(lib.slots[0].path, [0])
			t.is(lib.slots[0].attr, 'innerHTML');
		}
	},
	attr : {
		onclick_func : (t)=>{
			window.temp = 6;
			tree = xo.render(root, window.x`<div onclick=${()=>window.temp=7}></div>`);
			tree.el.onclick()
			t.is(window.temp, 7)
		}
	},
	undef : (t)=>{
		tree = xo.render(root, window.x`<div>${undefined}</div>`);

		console.log(tree)
	}


}