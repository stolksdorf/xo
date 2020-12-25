


Debug = (tree)=>{


	setInterval(()=>{

		document.getElementById('tree').innerHTML = JSON.stringify(Utils.normalize(tree), null, '  ');
		document.getElementById('lib').innerHTML = JSON.stringify(Utils.normalize(Library), null, '  ');
	}, 500)
}