const matcher = /<([^\s>]+)(?:\s*\/>|((?:\s+[^\s>]+)*)>([^<]*?)<\/\1>)/m;
const html = `
<div>
		<h1>oh hello</h1>
		<div>test</div>
		<p>
				<a href='test'>test</a>
				<a href="toost" class="yo">blippity blam</a>
				<AAA1 />
		</p>
</div>`;

const convertHtmlToTemplate = (source, temp=[]) => {



	const result = source.replace(matcher, (_match, tag, props, children) => {
		console.log(_match);
		temp.push({tag, props, children})

		return ''

		//return `${tag}({ ${props ? `props: \`${props}\`,` : ''} ${children ? `children: \`${children}\`,` : ''} })`;
	});
	if (source != result) {
		return convertHtmlToTemplate(result, temp);
	}
	console.log('____________');
	return temp;
};


const temp = convertHtmlToTemplate(html)

console.log('--------');
console.log(temp);