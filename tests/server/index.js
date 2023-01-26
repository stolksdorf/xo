const check = require('../picocheck.js');
const xo = require('../../');
const {x, comp, cx, render} = xo;

check({

	basic(t){
		let name = 'Scott';
		const tmpl = x`<div class='basic'>${name}</div>`;
		const res = render(tmpl);
		t.eq(`<div class='basic'>Scott</div>`, res);
	},
	component(t){
		let renders = 0

		const Item = (name)=>x`<li>${name}</li>`
		const Widget = comp(function(initText){
			this.text = this.useState(initText);
			this.useEffect(()=>{
				t.fail('useEffect should not fire')
			});
			const id = this.useRef('foo');

			const onClick = ()=>{};

			this.text += '!';
			renders++;
			return x`<div id=${id} onclick=${onClick}>${this.text}<ul>${['a', 'b'].map(Item)}</ul></div>`
		});

		const Result = xo.render(Widget('hello'));

		t.eq(1, renders, 'Should only render once');

		console.log(Result)

	}


})