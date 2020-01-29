const appName = 'arcus';
const uname = require('username');
const fs = require('fs');
const { ipcRenderer } = require('electron');
const con = require('electron').remote.getGlobal('console');
const { dialog } = require('electron').remote;
let username;

(async () => {
	username = await uname();
})();

document.getElementById('browse').addEventListener('click', () => {
	let selectedFolder = dialog.showOpenDialogSync({
		properties: ['openDirectory']
	})[0];
	document.getElementById('path').value = selectedFolder;
});

document.getElementById('done').addEventListener('click', () => {
	if (document.getElementById('path').value !== '') {
		// TODO: Validate given path
		con.log('Working');
		const game = {
			skyrim: document.getElementById('path').value
		};
		const dir = `/home/${username}/.local/share`;
		fs.writeFile(`${dir}/${appName}/config.json`, JSON.stringify(game), err => {
			if (err) throw err;
			con.log('The file has been saved!');
			const conf = fs.readFileSync(`${dir}/${appName}/config.json`, 'utf8');
			con.log(JSON.parse(conf));
		});
		ipcRenderer.send('close-select');
	}
});
