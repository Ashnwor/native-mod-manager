const { platform, dialog, ipcRenderer, appName, fs, os, join } = window;
const { utils } = window;
const selectedGame = 'skyrimSE';
const { homedir } = os;

document.getElementById('browse').addEventListener('click', () => {
	let defaultPath;
	if (platform === 'darwin') {
		defaultPath = join(
			`${homedir}/Library/Application Support/Steam/steamapps/common/Skyrim Special Edition`
		);
	} else if (platform === 'linux') {
		defaultPath = join(`${homedir}/.steam/steam/steamapps/common/Skyrim Special Edition`);
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
			dir = join(`${homedir}/Library/Application Support`);
		} else if (platform === 'linux') {
			dir = join(`${homedir}/.local/share`);
		}

		fs.writeFileSync(join(`${dir}/${appName}/config.json`), JSON.stringify(game, null, 4), err => {
			if (err) throw err;
			utils.debug('The file has been saved!');
		});
		const conf = fs.readFileSync(join(`${dir}/${appName}/config.json`), 'utf8');
		utils.debug(JSON.parse(conf));

		ipcRenderer.send('show-main');
		ipcRenderer.send('close-select');
	}
});
