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


	}
}