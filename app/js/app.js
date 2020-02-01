if (window.platform === 'linux') {
	const dir = `/home/${window.getUsername}/.local/share`;

	if (!window.fs.existsSync(`${dir}/${window.appName}`)) {
		window.con.log('First time setup');
		window.fs.mkdirSync(`${dir}/${window.appName}`);
		window.ipcRenderer.send('open-game-select');
	}

	window.ipcRenderer.on('continue-after-select', () => {
		let skseFound = false;
		const conf = window.fs.readFileSync(
			`${dir}/${window.appName}/config.json`,
			'utf8'
		);

		config = JSON.parse(conf);
		dirArr = window.fs.readdirSync(config['skyrim']);

		for (i = 0; i < dirArr.length; i += 1) {
			if (dirArr[i].slice(0, 6) === 'skse64') {
				skseFound = true;
				// TODO: Add dropdown menu to start script extender
				break;
			}
		}

		if (skseFound === true) {
			window.con.log('skseFound:', skseFound);
			// TODO: Add an item to dropdown menu to start script extender
		} else if (skseFound === false) {
			window.con.log('skseFound:', skseFound);
			// TODO: Add an item to dropdown menu to install script extender
		}
	});
}
