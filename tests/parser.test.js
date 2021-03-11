x = window.x;
tests.parser = {
	basic : (t)=>{
		const foo = x`<div></div>`;
		t.is(foo.data, []);
		t.is(Library[foo.key].slots, [])
		t.is(Library[foo.key].dom.outerHTML, '<div></div>')
	},
	attr : (t)=>{
		const foo = x`<div id=${'test'} onclick=${()=>{}}></div>`;
		t.is(foo.data[0], 'test');
		t.is(Library[foo.key].slots.length, 2)
		t.is(Library[foo.key].slots[0], {path : [0], attr:'id'})
		t.is(Library[foo.key].slots[1], {path : [0], attr:'onclick'})
		t.is(Library[foo.key].dom.outerHTML, '<div></div>')
	},

	singleEmbed : (t)=>{

		const foo = x`<section>
			oh hello

			<div class='lower'>
				${x`<div>test</div>`}
			</div>
		</section>`

		//lower should exist
		// maybe try with a component

		//console.log(foo);


	},
	multi_top_element : (t)=>{
		t.throws(()=>{
			const res = x`<div>hello</div><div>world</div>`;
		})
	},
	nested_bug : (t)=>{
		// a single children seems to 'eat' it's parent
		/*
			This bug is due to a "fix" in the parser for when a slot is an only child
			of an element.

			If what goes in the slot is suppose to be data, we want to write it to the 'innerHTML' directly

			if is a bp we need a slot there


			potentially solution:
			- Special case for when data mounts and unmounts
			- If data node mounts and target is a <slot>, instead sets parents to targetEl
			- on data unmount replaces the <slot> and sets the node's targetEl back to the slot.


			other potential solution
			- On data mount, replaces s<slot> with textNode https://www.w3schools.com/jsref/met_document_createtextnode.asp
			- writes val right into there, hopefully updates to it are easy?
			- unmounting should be fine, as the new node will overwrite the existing dom node
			- does this look good in the DOM though?

		*/

		let tree


		const func = (child)=>x`<div>${child}</div>`;

		tree = xo.render(root, func('I am text'));

		t.is(tree.children[0].type, 'data');
		t.is(tree.children[0].val, 'I am text');
		t.is(tree.children[0].el.nodeName, '#text')

		tree = xo.render(root, func(x`<span>x</span>`), tree);


		t.is(tree.children[0].type, 'bp');
		t.is(tree.children[0].el.outerHTML, '<span>x</span>')


		tree = xo.render(root, func("I am more text"), tree);

		t.is(tree.children[0].type, 'data');
		t.is(tree.children[0].val, 'I am more text');
		t.is(tree.children[0].el.nodeName, '#text')

	}
}