const sequence = async (obj, fn)=>Object.entries(obj).reduce((a,[k,v])=>a.then((r)=>fn(v,k,r)),Promise.resolve());
const isSame = (a,b)=>(typeof a==='object')?Object.entries(a).every(([k,v])=>isSame(v,b[k])) : a===b;

const runTest = async (test)=>{
	try{
		const Harness = {
			timeout : 2000,
			type    : (val, type, msg) => Harness.is((Array.isArray(val) ? 'array' : typeof val), type, msg),
			is      : (a,b)=>{ if(!isSame(a,b)){ throw new Error(`${a} does not equal ${b}`)} },
			fail    : (msg=`Test failed manually`)=>{throw new Error(msg);}
		};
		Harness.wait = new Promise((resolve, reject)=>{
			Harness.pass = resolve;
			Harness.reject = (msg=`Test rejected manually`)=>reject(msg);
		}).then(()=>true).catch((err)=>new Error(err));

		const testResult = test(Harness);
		if(!(testResult instanceof Promise)) return true;
		Harness.fail = Harness.reject;
		return await Promise.race([
			Harness.wait,
			testResult.then(()=>true).catch(err=>new Error(err)),
			new Promise((r)=>{setTimeout(()=>r(new Error('Test failed: Timeout Error')), Harness.timeout)})
		]);
	}catch(err){
		if(!(err instanceof Error)) return new Error('Thrown a non-Error type. Could not get a stack trace.');
		return err;
	}
};

const hasOnlyFlag = (cases)=>{
	return !!Object.entries(cases).find(([name, test])=>{
		if(name.startsWith('$')) return true;
		if(typeof test == 'object') return hasOnlyFlag(test);
	});
};

window.PicoCheck = async (cases, showLogs=true)=>{
	const chalk = Object.entries({
			bright: 1,  grey : 90,  red:  31,
			green:  32, yellow:33, blue: 34,
			magenta:35, cyan:  36, white:37,
		}).reduce((acc, [name, id])=>{ return {...acc, [name]:(showLogs?(txt, idt=0)=>{console.log(`${' '.repeat(idt)}\x1b[${id}m${txt}\x1b[0m`)}:()=>{})}}, {});


	let skipped=0, passed=0, failed=0;
	let OnlyMode = hasOnlyFlag(cases);
	if(OnlyMode) chalk.yellow('⚠ Some tests flagged as only ⚠ \n');

	const log = (val, name, indent)=>{
		if(val===null){ return chalk.magenta(name, indent); }
		if(val===false){ skipped++; return chalk.blue(`${name}`, indent); }
		if(val===true){ passed++; return chalk.green(`✔ ${name}`, indent); }
		failed++;
		chalk.red(`❌ ${name}`, indent);
		console.log(val);
	};

	const loop = async (obj, indent=0, skip=false, force=false)=>{
		await sequence(obj, async (test, name)=>{
			let shouldSkip = skip || name.startsWith('_');
			let onlyName = name.startsWith('$')||name.endsWith('$');
			if(typeof test == 'object'){
				log(null, name, indent);
				return await loop(test, indent+2, shouldSkip, force||onlyName);
			}
			if(shouldSkip || (!onlyName && OnlyMode && !force)) return log(false, name, indent);
			const result = await runTest(test);
			return log(result, name, indent);
		});
	};

	await loop(cases);
	chalk.grey('______________________________\n');
	chalk.green(`${passed} passed`);
	chalk.red(`${failed} failed`);
	chalk.cyan(`${skipped} skipped`);

	return {skipped, passed, failed};
};
