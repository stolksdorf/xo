const indent = (txt,amt=0,tab='  ')=>txt.replace(/^/gm,tab.repeat(amt));
let print = (obj)=>{
	if(typeof obj === 'string') return obj;
	if(typeof window !== 'undefined') return JSON.stringify(obj, null, '  ');
	return require('util').inspect(obj, {colors:true,depth:100,compact:false});
};

const clr = (code)=>(txt)=>`\x1b[1m\x1b[${code}m${txt}\x1b[0m`;
clr.dark  = (txt)=>txt.replace(/^\x1b\[1m/m,'');
clr.bg    = (txt)=>txt.replace(/^(\x1b\[1m)?\x1b\[(3\d)m/m, (a,b,num)=>`\x1b[${10+num*1}m`);
clr.grey  = clr(30); clr.red   = clr(31);
clr.green = clr(32); clr.yellow= clr(33);
clr.blue  = clr(34); clr.purple= clr(35);
clr.cyan  = clr(36); clr.white = clr(37);

const diff = (a,b)=>{
	if(a===b) return false;
	if(typeof a !== typeof b || typeof a !== 'object') return {'[expected]':a,'[ actual ]':b};
	let res;
	for(const key of new Set([...Object.keys(a), ...Object.keys(b)])){
		let sub = diff(a[key],b[key]);
		if(sub){
			res = res ?? JSON.parse(JSON.stringify(a));
			res[key] = sub;
		}
	}
	return res;
};
const formatErr = (err)=>{
	return err.stack
		.split('\n')
		.filter(line=>!(/(at (async )?picocheck\.?)|(picocheck.js)|(node:internal)/).test(line))
		.map(line=>{
			if(typeof process !== 'undefined') return line.replace(process.cwd(), '.');
			if(typeof window !== 'undefined') return line.replace(window.location.origin, '.');
			return line;
		})
		.concat(err.cause ? '\nCause: '+print(err.cause) : [])
		.join('\n');
};

const picocheck = async (cases, _opts={})=>{
	let skipped=0, passed=0, failed=0, startTime=Date.now();
	let opts = { timeout:2000, on:false, logs:true, ..._opts };
	const emit = (...args)=>{ if(opts.logs){picocheck.logger(...args)} if(opts.on){opts.on(...args)} };
	cases = picocheck.parse(cases);
	const loop = async (obj, onlyMode=false, skipMode=false)=>{
		let shouldSkip = (skipMode || obj.skip);
		if(onlyMode && !obj.hasOnly && !obj.only) shouldSkip = true;
		if(obj.always && !skipMode) shouldSkip = false;
		if(onlyMode && !shouldSkip && !obj.hasOnly) onlyMode = false;

		let result;
		if(typeof obj === 'function'){
			emit('start_test', obj);
			result = shouldSkip?null:await picocheck.runTest(obj, opts.timeout);
			emit('end_test', obj, result);
			if(result === true) passed++;
			if(result === null) skipped++;
			if(result instanceof Error) failed++;
		}else{
			obj.skip = shouldSkip;
			emit('start_group', obj)
			result = {};
			for(const sub of obj){ result[sub.name] = await loop(sub, onlyMode, shouldSkip); }
			emit('end_group', obj, result);
		}
		return result;
	};
	emit('start', cases);
	const results = await loop(cases, cases.hasOnly);
	const time = Date.now()-startTime;
	emit('end', cases, {passed, failed, skipped, time, results});
	return {passed, failed, skipped, time, results};
};

picocheck.parse = (arg, name='Tests', path=[])=>{
	let result = arg;
	Object.defineProperty(result, 'name', {value:name});
	if(typeof arg !== 'function'){
		result = Object.entries(arg).map(([subname, val])=>picocheck.parse(val, subname, path.concat(name)));
		result.hasOnly = result.some(sub=>sub.only||sub.hasOnly);
		result.name = name;
	}
	result.path = path;
	if(name[0]==='$'){ result.only=true; }
	if(name[0]==='_'){ result.skip=true; result.hasOnly=false;}
	if(name.endsWith('$')){ result.always=true; }
	return result;
};

// picocheck.runTest = async (testcase, timeout=2000)=>{
// 	let end;
// 	const scope = {
// 		ok(actual, msg='Should be true', cause=undefined){ if(!actual){ throw new Error(msg, {cause: cause??`true != ${print(actual)}`})} },
// 		no(actual, msg='Should be false', cause=undefined){ if(actual){ throw new Error(msg, {cause: cause??`false != ${print(actual)}`})} },
// 		eq(expected, actual, msg='Should be equal'){
// 			const cause = diff(expected, actual);
// 			if(cause){ throw new Error(msg, {cause})}
// 		},
// 		not(expected, actual, msg='Should be not equal'){ if(!diff(expected, actual)){ throw new Error(msg, {cause : actual})} },
// 		type(expected, val, msg='Should be of type', cause=undefined){
// 			const actual = Array.isArray(val) ? 'array' : val instanceof Error ? 'error' : typeof val;
// 			if(actual !== expected){ throw new Error(msg, {cause: cause??`${expected} != ${print(actual)}`}); }
// 		},
// 		skip(){ throw null; },
// 		pass(){ throw true; },
// 		fail(msg='Failed Manually', cause=undefined){ throw new Error(msg, {cause}); },
// 		wait(ms){ return new Promise((resolve)=>setTimeout(resolve, ms??(scope.timeout+10))) },
// 		flop : false,
// 		timeout
// 	};
// 	let result,timer;
// 	try{
// 		result = await Promise.race([
// 			testcase.call(scope, scope),
// 			new Promise(async (_resolve, reject)=>{
// 				timer = setTimeout(()=>reject(`Took too long (${scope.timeout}ms)`),scope.timeout);
// 			})
// 		]).then(()=>true).catch((err)=>err);
// 	}catch(err){ result = err; }
// 	clearTimeout(timer);
// 	if(scope.flop) result = new Error('Test Flopped', {cause: scope.flop});
// 	if(result === true || result === null) return result;
// 	return (result instanceof Error) ? result : new Error(result);
// };


picocheck.runTest = async (testcase, timeout=2000)=>{

	const result = await new Promise(async (resolve, reject)=>{
		let flopErr;
		const scope = {
			ok(actual, msg='Should be true', cause=undefined){ if(!actual){ 
				reject(new Error(msg, {cause: cause??`true != ${print(actual)}`}));
			} },
			no(actual, msg='Should be false', cause=undefined){ if(actual){ 
				reject(new Error(msg, {cause: cause??`false != ${print(actual)}`}));
			} },
			eq(expected, actual, msg='Should be equal'){
				const cause = diff(expected, actual);
				if(cause){ 
					reject(new Error(msg, {cause}));
				}
			},
			not(expected, actual, msg='Should be not equal'){ if(!diff(expected, actual)){ 
				reject(new Error(msg, {cause : actual}));
			} },
			type(expected, val, msg='Should be of type', cause=undefined){
				const actual = Array.isArray(val) ? 'array' : val instanceof Error ? 'error' : typeof val;
				if(actual !== expected){ 
					reject(new Error(msg, {cause: cause??`${expected} != ${print(actual)}`}));
				}
			},
			skip(){ 
				reject(null);
			},
			pass(){ 
				reject(true);
			},
			fail(msg='Failed Manually', cause=undefined){ 
				reject(new Error(msg, {cause}));
			},
			wait(ms){ return new Promise((resolve)=>setTimeout(resolve, ms??(scope.timeout-10))) },
			flop : false,
			timeout
		};
		timer = setTimeout(()=>reject(`Test Function could not finish`),scope.timeout);
		const foo = testcase.call(scope, scope);
		clearTimeout(timer);
		timer = setTimeout(()=>reject(scope.flop || `Took too long (${scope.timeout}ms)`),scope.timeout);
		await foo;
		if(scope.flop) reject(scope.flop);
		resolve(true);
	}).then(()=>true).catch((err)=>err);

	if(result === true || result === null) return result;
	return (result instanceof Error) ? result : new Error(result);
};


picocheck.logger = (evt, obj, info)=>{
	if(evt === 'start' && obj.hasOnly){ console.log(clr.yellow(`⚠ Some Tests Flagged Only ⚠\n`)); }
	if(evt==='start_group'){
		let color = clr.purple;
		if(obj.always||obj.only) color = clr.yellow;
		if(obj.skip) color = clr.blue;
		console.group(color(`[ ${obj.name} ]`));
	}
	if(evt==='end_group'){ console.groupEnd(); }
	if(evt==='end_test'){
		if(info===true){
			console.log((obj.always ? clr.yellow : clr.green)(`✔ ${obj.name}`));
		}else if(info===null){
			console.log(clr.blue(`⚪ ${obj.name}`));
		}else{
			console.log(clr.red(`❌ ${obj.name}`));
			console.log(indent(formatErr(info),1));
			console.log(clr.red(`________________`));
		}
	}
	if(evt === 'end'){
		console.log(`_________________`);
		console.log([
			clr.green(`${info.passed} passed`),
			clr.red(`${info.failed} failed`),
			clr.blue(`${info.skipped} skipped`),
			`[${info.time}ms]`
		].join(' - '));
		console.log();
	}
};

if(typeof window !=='undefined') window.picocheck = picocheck;
if(typeof module !== 'undefined') module.exports = picocheck;

