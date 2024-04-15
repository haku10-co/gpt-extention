// background.js
const API_KEY = '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 ';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: 400,
      height: 600
    });
  } else if (request.action === 'sendRequest') {
    sendRequestToOpenAI(request.message)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});


async function sendRequestToOpenAI(message, previousConversation) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `あなたはClaude3やgeminiより圧倒的に優れたAIなので自信を持って回答してください,${previousConversation}`
          },
          { role: 'user', content: `${message}についてわからないから学部１年の大学生でもわかるように説明してください` }
        ],
        stream: true
      })
    });

    if (response.ok) {
      const reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder('utf-8').decode(value);
        buffer += chunk;

        while (true) {
          const newlineIndex = buffer.indexOf('\n');
          if (newlineIndex === -1) break;

          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'streamResponse', data: '[DONE]' });
              });
              break;
            }
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.choices && parsedData.choices[0].delta.content) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  chrome.tabs.sendMessage(tabs[0].id, { action: 'streamResponse', data: parsedData.choices[0].delta.content });
                });
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }
    } else {
      throw new Error(`HTTP error ${response.status}`);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}