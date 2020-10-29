Monday, 29/06/2020

-






- Add in v-dom




- Figure out a fancier way to do state (https://dev.to/kayis/react-hooks-demystified-2af6)
  (https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)

- Possibly simplify th hyperx implementation
	https://jsfiddle.net/wn4aer2L/2/



```
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

const convertHtmlToTemplate = (source) => {
	const result = source.replace(matcher, (_match, tag, props, text) => {
  	return `${tag}({ ${props ? `props: \`${props}\`,` : ''} ${text ? `text: \`${text}\`,` : ''} })`;
	});
  if (source != result) {
  	return convertHtmlToTemplate(result);
  }
  return result;
};

document.getElementById('html').innerText = html;
document.getElementById('template').innerText = convertHtmlToTemplate(html);

```
