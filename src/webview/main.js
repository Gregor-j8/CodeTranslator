const vscode = acquireVsCodeApi();

const languageDropdown = document.getElementById('languageSelect');
const processBtn = document.getElementById('processBtn');
const userInput = document.getElementById('userInput');
const output = document.getElementById('output');
const aiOutput = document.getElementById('aiOutput');

languageDropdown.addEventListener('change', () => {
    if (languageDropdown.value !== 'languageSelect')
    {
        vscode.postMessage({
        command: 'dropdownChange',
        language: languageDropdown.value
    });
    }
});

processBtn.addEventListener('click', () => {
    vscode.postMessage({
        command: 'processCode',
        userInput: userInput.value,
        output: output.textContent,
        language: languageDropdown.value
    });
});

window.addEventListener('message', event => {
    const message = event.data;

    if (output && message.command === 'updateOutput') {
        output.textContent = message.text;
    }

    if (aiOutput && message.command === 'updateAIOutput') {
        aiOutput.textContent = message.text;
    }

    if (aiOutput && message.command === 'streamToken') {
        aiOutput.textContent += message.token;
    }
});
