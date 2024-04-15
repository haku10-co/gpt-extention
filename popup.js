const API_KEY = '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 ';
const user_input = document.getElementById('user-input');
const send_button = document.getElementById('send-button');
const chat_history = document.getElementById('chat-history');

chrome.storage.local.get('selectedText', ({ selectedText }) => {
  user_input.value = selectedText;
  sendMessage();
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'streamResponse') {
    addMessageToChat('assistant', request.data, true);
  }
});
send_button.addEventListener('click', sendMessage);
user_input.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

async function sendMessage() {
  const user_message = user_input.value;
  user_input.value = '';
  addMessageToChat('user', user_message);
  isWaitingForUserInput = false;

  chrome.runtime.sendMessage({ action: 'sendRequest', message: user_message }, (response) => {
    if (!response.success) {
      console.error('Error:', response.error);
      addMessageToChat('assistant', 'An error occurred. Please try again.');
    }
  });
}

let isWaitingForUserInput = false;
let lastAssistantMessageElement = null;

let previousConversation = '';

function addMessageToChat(role, message, isStreaming = false) {
    if (role === 'user') {
        isWaitingForUserInput = false;
        lastAssistantMessageElement = null;
        const message_element = document.createElement('div');
        message_element.classList.add('message', role);
        message_element.innerText = message.trim();
        chat_history.appendChild(message_element);
        previousConversation += `User: ${message.trim()}\n`;
    } else if (role === 'assistant') {
        if (!lastAssistantMessageElement || isWaitingForUserInput) {
            lastAssistantMessageElement = document.createElement('div');
            lastAssistantMessageElement.classList.add('message', role);
            chat_history.appendChild(lastAssistantMessageElement);
        }
        if (isStreaming) {
            if (message === '[DONE]') {
                isWaitingForUserInput = true;
                previousConversation += `Assistant: ${lastAssistantMessageElement.innerText.trim()}\n`;
            } else {
                lastAssistantMessageElement.innerText += message;
            }
        } else {
            lastAssistantMessageElement.innerText = message.trim();
            isWaitingForUserInput = true;
            previousConversation += `Assistant: ${message.trim()}\n`;
        }
    }
    chat_history.scrollTop = chat_history.scrollHeight;
}