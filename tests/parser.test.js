const {x, comp, render} = xo;


Tests.Parser = {
	basic(){
		let name = 'scoot';
		const func = ()=>alert('yo');
		const template = x`<div onclick=${func}>
			oh hello ${name}! ${true}
			<button disabled=${true}>${name}</button>
		</div>`;

		Result = render(template);

		//console.log(Result.innerHTML)

		window.temp1 = template.tmpl;
	},
	basic2(t){

		const func = ()=>alert('yo');

		const template2 = x`<div onclick=${func}>
			oh hello ${name}! ${true}
			<button disabled=${true}>${name}</button>
		</div>`;

		//console.log(template2);
	},
	basic3(t){
		const temp = x`<div id=${'a'} onclick=${'b'}>
				${'c'}: <em>${'d'}</em> hey !${'e'} <a>lonk</a>
			</div>`;
		Result = render(temp);
	}
}
