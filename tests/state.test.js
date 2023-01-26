const xo = require('../');
const {x, comp, render} = xo;


Number.prototype.reduce = function(func, acc){ for(let idx=0;idx<this;idx++){ acc=func(idx,idx,idx); } return acc };
Number.prototype.each = function(func){ this.reduce(func); };



module.exports = ()=>{

	const Base = comp(function(initTxt){

		const [txt, setTxt] = this.useState('yo');
		this.counter = this.useSignal(0);


		this.useEffect(()=>{
			console.log('MOUNTED', this.el);
			this.foo = 'yo';
			//this.counter = 0;
			let temp = setInterval(()=>{
				//console.log('SETTING')
				this.counter = this.counter + 1;


			}, 500);
			return ()=>clearInterval(temp);
		}, [initTxt]);

		const toggle = ()=>{
			if(txt === 'yo') return setTxt('foo');
			if(txt === 'foo') return setTxt('yo');
		}


		//console.log({initTxt})


		return x`<div onclick=${toggle}>${txt}:${initTxt}: ${this.counter}</div>`;
		//return x`<div>${initTxt}</div><span>yo</span>`;
	});



	// const Base = comp(function(initTxt){

	// 	const [txt, setTxt] = this.useState('yo');
	// 	const [counter, setCounter] = this.useState(0);

	// 	console.log(counter)

	// 	console.log('running');

	// 	this.useEffect(()=>{
	// 		console.log('whoa!', this.el);
	// 		setCounter(0);
	// 		let temp = setInterval(()=>{
	// 			console.log('SETTING')
	// 			setCounter(counter + 1);

	// 			console.log(counter);
	// 		}, 1000);
	// 		return ()=>clearInterval(temp);
	// 	}, [initTxt]);

	// 	const toggle = ()=>{
	// 		if(txt === 'yo') return setTxt('foo');
	// 		if(txt === 'foo') return setTxt('yo');
	// 	}

	// 	console.log('cpounter', counter);



	// 	return x`<div onclick=${toggle}>${txt}:${initTxt}: ${counter}</div>`;
	// 	//return x`<div>${initTxt}</div><span>yo</span>`;
	// });



	Root = render(Base('oh hello'), Root);
	console.log(Root)

	setTimeout(()=>{
		console.log('firing');
		Root = render(Base('UPDATE'), Root);
	}, 2000);
};