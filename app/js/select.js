window.ipcRenderer.send('hide-main');

let selectedGame = 'skyrimSE';
document.getElementById('browse').addEventListener('click', () => {
	let selectedFolder = window.dialog.showOpenDialogSync({
		properties: ['openDirectory', 'showHiddenFiles'],
		defaultPath: `/home/${window.getUsername}/.steam/steam/steamapps/common/Skyrim Special Edition`
	})[0];
	document.getElementById('path').value = selectedFolder;
});

document.getElementById('done').addEventListener('click', () => {
	if (document.getElementById('path').value !== '') {
		// TODO: Validate given path
		window.con.log('Working');
		const game = {
			[selectedGame]: document.getElementById('path').value
		};
		const dir = `/home/${window.getUsername}/.local/share`;
		window.fs.writeFile(
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
