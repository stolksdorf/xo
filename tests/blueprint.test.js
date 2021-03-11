x = x;
tests.blueprints = {

	basic : {
		render : (t)=>{
			tree = xo.render(root, x`<div>test</div>`);
			t.is(tree.el.outerHTML, '<div>test</div>')
		},

		slot : (t)=>{
			tree = xo.render(root, x`<div>${'test!'}</div>`);
			t.is(tree.el.outerHTML, '<div>test!</div>');
			t.is(tree.children[0].val, 'test!');
			t.is(tree.children[0].attr, 'textContent');
		},

		lib : (t)=>{
			tree = xo.render(root, x`<div>${'test!'}</div>`);

			let lib = Library[tree.key];
			t.is(lib.dom.outerHTML, '<div><slot></slot></div>');
			t.is(lib.slots.length, 1);
			t.is(lib.slots[0].path, [1]);
			t.is(lib.slots[0].attr, 'innerHTML');
		}
	},
	attr : {
		onclick_func : (t)=>{
			window.temp = 6;
			tree = xo.render(root, x`<div onclick=${()=>window.temp=7}></div>`);
			tree.el.onclick()
			t.is(window.temp, 7)
		}
	},
	undef : {

		data: (t)=>{
			tree = xo.render(root, x`<div>${'foo'}</div>`);
			tree = xo.render(root, x`<div>${undefined}</div>`, tree);

			t.is(tree.el.outerHTML, '<div></div>')
		}
	}


}