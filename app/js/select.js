window.ipcRenderer.send('hide-main');

document.getElementById('browse').addEventListener('click', () => {
	let selectedFolder = window.dialog.showOpenDialogSync({
		properties: ['openDirectory']
	})[0];
	document.getElementById('path').value = selectedFolder;
});

document.getElementById('done').addEventListener('click', () => {
	if (document.getElementById('path').value !== '') {
		// TODO: Validate given path
		window.con.log('Working');
		const game = {
			skyrim: document.getElementById('path').value
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
