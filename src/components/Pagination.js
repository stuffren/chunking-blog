export function Pagination({ current, total, onPageChange }) {
  const nav = document.createElement('nav');
  nav.className = 'pagination';
  
  // 上一页
  if (current > 1) {
    const prev = document.createElement('a');
    prev.href = '#';
    prev.className = 'page-link prev';
    prev.textContent = '← Prev';
    prev.addEventListener('click', (e) => {
      e.preventDefault();
      onPageChange(current - 1);
    });
    nav.appendChild(prev);
  }
  
  // 页码
  const pageInfo = document.createElement('span');
  pageInfo.className = 'page-info';
  pageInfo.textContent = `Page ${current} of ${total}`;
  nav.appendChild(pageInfo);
  
  // 下一页
  if (current < total) {
    const next = document.createElement('a');
    next.href = '#';
    next.className = 'page-link next';
    next.textContent = 'Next →';
    next.addEventListener('click', (e) => {
      e.preventDefault();
      onPageChange(current + 1);
    });
    nav.appendChild(next);
  }
  
  return nav;
}