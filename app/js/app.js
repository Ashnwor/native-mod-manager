const debug = debugThis => window.globalDebug(debugThis);

const newDropdownEl = () => {
	const dropdownMenu = document.getElementById('dropdownMenu');
	const drowdownEl = document.createElement('a');
	drowdownEl.classList.add('dropdown-item');
	drowdownEl.innerText = 'TEST';
	dropdownMenu.appendChild(drowdownEl);
};

if (window.platform === 'linux') {
	const dir = `/home/${window.getUsername}/.local/share`;

	if (!window.fs.existsSync(`${dir}/${window.appName}`)) {
		debug('First time setup');
		window.fs.mkdirSync(`${dir}/${window.appName}`);
		window.ipcRenderer.send('open-game-select');
	}

	window.ipcRenderer.on('continue-after-select', () => {
		let conf = window.fs.readFileSync(
			`${dir}/${window.appName}/config.json`,
			'utf8'
		);
		let config = JSON.parse(conf);
		config.skseFound = false;
		dirArr = window.fs.readdirSync(config['skyrimSE']);

		window.fs.writeFile(
			`${dir}/${window.appName}/config.json`,
			JSON.stringify(config),
			err => {
				if (err) throw err;
				debug('The file has been saved!');
			}
		);

		conf = window.fs.readFileSync(
			`${dir}/${window.appName}/config.json`,
			'utf8'
		);
		debug(config);

		for (i = 0; i < dirArr.length; i += 1) {
			if (dirArr[i].slice(0, 6) === 'skse64') {
				config.skseFound = true;
				// TODO: Add dropdown menu to start script extender
				break;
			}
		}

		if (config.skseFound === true) {
			debug(`skseFound: ${config.skseFound}`);
			window.fs.writeFile(
				`${dir}/${window.appName}/config.json`,
				JSON.stringify(config),
				err => {
					if (err) throw err;
					debug('The file has been saved!');
				}
			);
			conf = window.fs.readFileSync(
				`${dir}/${window.appName}/config.json`,
				'utf8'
			);
			newDropdownEl();
			// TODO: Add an item to dropdown menu to start script extender
		} else if (config.skseFound === false) {
			debug(`skseFound: ${config.skseFound}`);
			// TODO: Add an item to dropdown menu to install script extender
		}
	});
}
