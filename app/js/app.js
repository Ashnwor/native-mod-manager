let dir;
let rawConfig;
debug = debugThis => window.globalDebug(debugThis);

const newDropdownEl = (id, label) => {
	const dropdownMenu = document.getElementById('dropdownMenu');
	const dropdownEl = document.createElement('a');
	dropdownEl.id = id;
	dropdownEl.classList.add('dropdown-item');
	dropdownEl.innerText = label;
	dropdownMenu.appendChild(dropdownEl);
};

const getConfig = () => {
	rawConfig = window.fs.readFileSync(`${dir}/${window.appName}/config.json`);
	config = JSON.parse(rawConfig);
};

const writeConfig = () => {
	window.fs.writeFileSync(
		`${dir}/${window.appName}/config.json`,
		JSON.stringify(config, null, 4),
		err => {
			if (err) throw err;
			debug('The file has been saved!');
		}
	);
	getConfig();
};

// First start
if (window.platform === 'linux') {
	dir = `/home/${window.getUsername}/.local/share`;

	if (!window.fs.existsSync(`${dir}/${window.appName}`)) {
		debug('First time setup');
		window.fs.mkdirSync(`${dir}/${window.appName}`);
		window.ipcRenderer.send('open-game-select');
	}

	window.ipcRenderer.on('continue-after-select', () => {
		getConfig();
		config.skseFound = false;
		dirArr = window.fs.readdirSync(config['skyrimSE']);
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
			writeConfig();
			newDropdownEl('launchSKSE', 'Launch SKSE'); // Temporarily here
			config.dropdownMenuItems = {
				skse: { id: 'launchSKSE', title: 'Launch SKSE' }
			};
			writeConfig();
			debug(config);
			// TODO: Add an item to dropdown menu to start script extender
		} else if (config.skseFound === false) {
			debug(`skseFound: ${config.skseFound}`);
			newDropdownEl('installSKSE', 'Install SKSE'); // Temporarily here
			debug(config);
			// TODO: Add an item to dropdown menu to install script extender
		}
	});
}

// import dropdown menu items
getConfig();
newDropdownEl(
	config.dropdownMenuItems.skse.id,
	config.dropdownMenuItems.skse.title
);
newDropdownEl('launchSkyrimSE', 'Launch Skyrim Special Edition');
