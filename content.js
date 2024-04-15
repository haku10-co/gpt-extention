const API_KEY = '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';

document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.storage.local.set({ selectedText });

    let button = document.getElementById('selection-button');
    if (!button) {
      button = document.createElement('button');
      button.id = 'selection-button';
      button.innerText = '💬';
      button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openPopup' });
      });
      document.body.appendChild(button);
    }

    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();
    button.style.left = `${rect.right + window.scrollX}px`;
    button.style.top = `${rect.bottom + window.scrollY}px`;
    button.style.display = 'block';
  } else {
    const button = document.getElementById('selection-button');
    if (button) {
      button.style.display = 'none';
    }
  }
});