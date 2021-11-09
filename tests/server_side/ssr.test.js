const {x, comp, render} = require('../src/xo.js');


const Foo = comp(function(doot){
	console.log(this.useState)

	const [count, setCount] = this.useState(5);

	this.useEffect(()=>{
		console.log('hello')
	});

	return x`<span>${count}</span>`
})

const Button= (text)=>{

	return x`<button onclick=${()=>alert('okay')}>${Foo()}</button>`
}

console.log(render(Button('foo')))

/*
	make sure state and effectrs work serverside
	make sure HTML is properly outputted
	make sure comps and templates work


*/