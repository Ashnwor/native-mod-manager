const debug = debugThis => window.globalDebug(debugThis);
const { platform, dialog, ipcRenderer, appName, fs, os } = window;
const selectedGame = 'skyrimSE';
const { homedir } = os;

document.getElementById('browse').addEventListener('click', () => {
	let defaultPath;
	if (platform === 'darwin') {
		defaultPath = `${homedir}/Library/Application Support/Steam/steamapps/common/Skyrim Special Edition`;
	} else if (platform === 'linux') {
		defaultPath = `${homedir}/.steam/steam/steamapps/common/Skyrim Special Edition`;
	}

	const selectedFolder = dialog.showOpenDialogSync({
		properties: ['openDirectory', 'showHiddenFiles'],
		defaultPath,
	})[0];
	document.getElementById('path').value = selectedFolder;
});

document.getElementById('done').addEventListener('click', () => {
	if (document.getElementById('path').value !== '') {
		// TODO: Validate given path
		const game = {
			[selectedGame]: document.getElementById('path').value,
		};
		let dir;

		if (platform === 'darwin') {
			dir = `${homedir}/Library/Application Support`;
		} else if (platform === 'linux') {
			dir = `${homedir}/.local/share`;
		}

		fs.writeFileSync(`${dir}/${appName}/config.json`, JSON.stringify(game, null, 4), err => {
			if (err) throw err;
			debug('The file has been saved!');
		});
		const conf = fs.readFileSync(`${dir}/${appName}/config.json`, 'utf8');
		debug(JSON.parse(conf));

		ipcRenderer.send('show-main');
		ipcRenderer.send('close-select');
	}
});
