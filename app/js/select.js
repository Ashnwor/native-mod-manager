const con = require('electron').remote.getGlobal('console');
const { dialog } = require('electron').remote;

document.getElementById('browse').addEventListener('click', () => {
	let selectedFolder = dialog.showOpenDialogSync({
		properties: ['openDirectory']
	})[0];
	document.getElementById('path').value = selectedFolder;
});
