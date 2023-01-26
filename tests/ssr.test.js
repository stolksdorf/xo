const {x, comp, render} = xo.ssr;


Tests.SSR = {


	complex(t){
		let renders = 0
		const Item = (name)=>x`<li>${name}</li>`
		const Widget = comp(function(initText){
			this.text = this.useState(initText);
			this.useEffect(()=>{
				t.fail('useEffect should not fire')
			});
			const id = this.useRef('test_id');

			const onClick = ()=>{};

			this.text += '!';
			renders++;
			return x`<div id=${id} onclick=${onClick}>${this.text}<ul>${['a', 'b'].map(Item)}</ul></div>`
		});

		const Result = render(Widget('hello there'));

		t.eq(`<div id=test_id onclick="">hello there!<ul><li>a</li><li>b</li></ul></div>`, Result);
		t.eq(1, renders, 'Should only render once');

		document.body.innerHTML = Result;
		t.eq('test_id', document.body.firstElementChild.id);
	}


};