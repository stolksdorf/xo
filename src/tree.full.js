const shortid = (n=8)=>Array.from(new Array(n*1),(v,i)=>'23456789abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random()*32)]).join('');


const Tree = {
	data : {},
	get : (id)=>{
		return Tree.data[id];
	},
	add : (rootId)=>{
		const root = Tree.data[rootId];
		const id = rootId ? shortid(5) : 'root';

		Tree.data[id] = {
			id, leaves :[]
		}
		if(root){
			Tree.data[id].rootId = root.id;
			Tree.data[root.id].leaves.push(id);
		}

	return Tree.data[id]
	},
	set : (id, data)=>{
		Tree.data[id] = {
			...Tree.data[id],
			...data
		}
		return Tree.data[id];
	},
	del : (id)=>{
		const prune = (id)=>{
			Tree.data[id].leaves.map(prune);
			delete Tree.data[id];
		}
		const root = Tree.data[Tree.data[id].rootId];
		prune(id);
		if(root){
			root.leaves = root.leaves.filter(x=>x!=id);
		}
	},
}




const foo = Tree.add()

Tree.add(foo.id);
const bar = Tree.add(foo.id);

Tree.add(bar.id);

console.log('bar', bar.id)
Tree.set(bar.id, {foo: true, a: 'b'})

console.log()


console.dir(Tree.data, {depth:13})

console.log(bar.id)

Tree.del('root')



console.dir(Tree.data, {depth:13})