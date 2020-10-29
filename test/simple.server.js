/**** Simple Static Server ****/
const http = require('http');
const url  = require('url');
const fs   = require('fs');
const path = require('path');

const server = (root = '', port = 8000)=>{
	const types = { '.ico': 'image/x-icon','.html': 'text/html','.js': 'text/javascript','.json': 'application/json','.css': 'text/css','.png': 'image/png','.jpg': 'image/jpeg','.wav': 'audio/wav','.mp3': 'audio/mpeg','.svg': 'image/svg+xml'};
	const getType = (ext)=>types[ext] || 'text/plain';
	http.createServer((req, res)=>{
		try{
			let systempath = path.join(process.cwd(), root, url.parse(req.url).pathname);
			let indexpath = path.join(systempath, 'index.html');
			if(fs.existsSync(indexpath)) systempath = indexpath;
			if(!fs.existsSync(systempath)){
				res.statusCode = 404;
				res.end(`File ${systempath} not found!`);
				return;
			}
			res.setHeader('Content-type', getType(path.parse(systempath).ext) );
			res.end(fs.readFileSync(systempath));
		}catch(err){
			console.log(err);
			res.statusCode = 500;
			res.end(`Error getting the file: ${err}.`);
		}
		return;
	}).listen(parseInt(port));
	console.log(`Static server listening on port ${port}`);
};