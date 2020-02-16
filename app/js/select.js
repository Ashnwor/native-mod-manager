const debug = debugThis => window.globalDebug(debugThis);
const selectedGame = 'skyrimSE';
document.getElementById('browse').addEventListener('click', () => {
	let defaultPath;
	if (window.platform === 'darwin') {
		defaultPath = `/Users/${window.getUsername}/Library/Application Support/Steam/steamapps/common/Skyrim Special Edition`;
	} else if (window.platform === 'linux') {
		defaultPath = `/home/${window.getUsername}/.steam/steam/steamapps/common/Skyrim Special Edition`;
	}
	const selectedFolder = window.dialog.showOpenDialogSync({
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

		if (window.platform === 'darwin') {
			dir = `/Users/${window.getUsername}/Library/Application Support`;
		} else if (window.platform === 'linux') {
			dir = `/home/${window.getUsername}/.local/share`;
		}

		window.fs.writeFileSync(`${dir}/${window.appName}/config.json`, JSON.stringify(game, null, 4), err => {
			if (err) throw err;
			debug('The file has been saved!');
		});
		const conf = window.fs.readFileSync(`${dir}/${window.appName}/config.json`, 'utf8');
		debug(JSON.parse(conf));

		window.ipcRenderer.send('show-main');
		window.ipcRenderer.send('close-select');
	}
});
