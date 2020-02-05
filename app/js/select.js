let selectedGame = 'skyrimSE';
document.getElementById('browse').addEventListener('click', () => {
	let defaultPath;
	if (process.platform === 'darwin') {
		defaultPath = `/Users/${window.getUsername}/Library/Application Support/Steam/steamapps/common/Skyrim Special Edition`;
	} else if (process.platform === 'linux') {
		defaultPath = `/home/${window.getUsername}/.steam/steam/steamapps/common/Skyrim Special Edition`;
	}
	let selectedFolder = window.dialog.showOpenDialogSync({
		properties: ['openDirectory', 'showHiddenFiles'],
		defaultPath: defaultPath
	})[0];
	document.getElementById('path').value = selectedFolder;
});

document.getElementById('done').addEventListener('click', () => {
	if (document.getElementById('path').value !== '') {
		// TODO: Validate given path
		const game = {
			[selectedGame]: document.getElementById('path').value
		};
		let dir;

		if (process.platform === 'darwin') {
			dir = `/Users/${window.getUsername}/Library/Application Support`;
		} else if (process.platform === 'linux') {
			dir = `/home/${window.getUsername}/.local/share`;
		}

		window.fs.writeFileSync(
			`${dir}/${window.appName}/config.json`,
			JSON.stringify(game),
			err => {
				if (err) throw err;
				window.con.log('The file has been saved!');
				const conf = window.fs.readFileSync(
					`${dir}/${window.appName}/config.json`,
					'utf8'
				);
				window.con.log(JSON.parse(conf));
			}
		);
		window.ipcRenderer.send('show-main');
		window.ipcRenderer.send('close-select');
	}
});
