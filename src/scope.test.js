// const test = {
// 	temp : {
// 		a : true
// 	},
// 	a : true
// };

// const gee = Symbol('hello')
// const foo = [
// 	{
// 		a : true,
// 		foo : {
// 			a : true
// 		}
// 	},
// 	{
// 		a : true,[gee] :'yo'
// 	},

// ]


// const mod = (obj)=>{
// 	obj.a = false
// };


// mod(foo[1])

// console.log(foo)

// console.log(foo[1][gee])

/* ------------------------------------------ */


const foo = ()=>{
	console.log(this.a)
}

function temp(){

	console.log(this.a)

	foo()
}


const scope = {
	a : true
}

temp.apply(scope, [])