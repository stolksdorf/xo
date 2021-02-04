


Debug = (tree)=>{


	setInterval(()=>{

		document.getElementById('tree').innerHTML = JSON.stringify(Utils.normalize(tree), null, '  ');
		document.getElementById('lib').innerHTML = JSON.stringify(Utils.normalize(Library), null, '  ');
	}, 500)
};

// const same = (a,b)=>{
// 	if(typeof a==='object') return Object.entries(a).every(([k,v])=>same(v,b[k]));
// 	return a===b;
// }

// const harness={
// 	is : (a,b)=>{
// 		if(!same(a,b)){ throw `${a} does not equal ${b}`}
// 	}
// };

// let allPassing = true;
// test = (obj, name='test', indent='')=>{
// 	if(typeof obj !== 'function'){
// 		console.log(`${indent}${name}:`);
// 		return Object.entries(obj).map(([k,v])=>{
// 			test(v,k,indent+'  ');
// 		});
// 	}
// 	try{
// 		obj(harness);
// 		console.log(`${indent}✅ ${name}`)
// 	}catch(err){
// 		allPassing = false;
// 		console.log(`${indent}❌ ${name}`);
// 		console.log(err);
// 		//alert(`Error:${name}\n\n${err.toString()}`)
// 	}
// }