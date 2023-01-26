const check = require('../picocheck.js');

const xo = require('../../');

const {x, comp, cx, render} = xo;






check({

	basic(t){
		let name = 'Scott';
		const tmpl = x`<div class='basic'>${name}</div>`;
		const res = render(tmpl);
		t.eq(`<div class='basic'>Scott</div>`, res);
	}


})