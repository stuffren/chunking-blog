import { marked } from 'marked';
import hljs from 'highlight.js';

// 配置 marked 使用 highlight.js 进行代码高亮
marked.use({
  renderer: {
    code(code, language) {
      const validLang = language && hljs.getLanguage(language);
      const highlighted = validLang 
        ? hljs.highlight(code, { language }).value 
        : hljs.highlightAuto(code).value;
      return `<pre><code class="hljs language-${language || 'plaintext'}">${highlighted}</code></pre>`;
    }
  }
});

export function renderMarkdown(body) {
  if (!body) return '';
  return marked(body);
}