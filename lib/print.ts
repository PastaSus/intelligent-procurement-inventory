export function printDocument() {
  const originalTitle = document.title;

  const restoreTitle = () => {
    document.title = originalTitle;
    window.removeEventListener('afterprint', restoreTitle);
  };

  document.title = '';
  window.addEventListener('afterprint', restoreTitle);
  window.print();
  setTimeout(restoreTitle, 0);
}
