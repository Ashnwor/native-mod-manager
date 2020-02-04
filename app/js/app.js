let dir;
let rawConfig;
debug = debugThis => window.globalDebug(debugThis);

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

const getPlugins = () => {
	const newRightMenuEl = (label, check) => {
		const rightMenu = document.getElementById('rightMenuList');
		const newListEl = document.createElement('li');
		const newDiv = document.createElement('div');
		const checkboxEl = document.createElement('input');
		const text = document.createElement('label');
		newDiv.classList.add('custom-control');
		newDiv.classList.add('custom-checkbox');
		checkboxEl.type = 'checkbox';
		checkboxEl.classList.add('custom-control-input');
		checkboxEl.id = label;
		checkboxEl.checked = check;
		text.classList.add('custom-control-label');
		text.htmlFor = label;
		text.innerText = label;
		newListEl.classList.add('list-group-item');
		newDiv.appendChild(checkboxEl);
		newDiv.appendChild(text);
		newListEl.appendChild(newDiv);
		rightMenu.appendChild(newListEl);
	};

	const isItPlugin = line => {
		if (line[0] === '#') {
			debug(`${line} COMMENT`);
		} else if (
			line[0] !== '*' &&
			`${line[line.length - 3]}${line[line.length - 2]}${
				line[line.length - 1]
			}` === 'esp'
		) {
			debug(`${line} PLUGIN, NOT ACTIVE`);
			newRightMenuEl(line, false);
		} else if (
			line[0] === '*' &&
			`${line[line.length - 3]}${line[line.length - 2]}${
				line[line.length - 1]
			}` === 'esp'
		) {
			debug(`${line} PLUGIN, ACTIVE`);
			newRightMenuEl(line.replace('*', ''), true);
		}
	};

	// Get this from preload in relation to selected game
	const skyrimSEid = 489830;
	const pfx = `${config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`;
	const pluginsDir = `${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`;

	debug(pluginsDir);
	const pluginsFile = window.fs.readFileSync(
		`${pluginsDir}/Plugins.txt`,
		'utf8'
	);

	let lines = [];
	pluginsFile.split(/\r?\n/).forEach(line => {
		lines.push(line);
	});
	debug(lines);

	for (i = 0; i < lines.length; i += 1) {
		isItPlugin(lines[i]);
	}
};

const newDropdownEl = (id, label) => {
	const dropdownMenu = document.getElementById('dropdownMenu');
	const dropdownEl = document.createElement('a');
	dropdownEl.id = id;
	dropdownEl.classList.add('dropdown-item');
	dropdownEl.innerText = label;
	dropdownEl.onclick = () => {
		document.getElementById('dropdownLabel').innerText = label;
		getConfig();
		config.dropdownMenuItems.lastSelected = { id: id, label: label };
		writeConfig();
	};
	dropdownMenu.appendChild(dropdownEl);
};

// First start
if (window.platform === 'linux') {
	dir = `/home/${window.getUsername}/.local/share`;

	if (!window.fs.existsSync(`${dir}/${window.appName}`)) {
		debug('First time setup');
		window.fs.mkdirSync(`${dir}/${window.appName}`);
		window.ipcRenderer.send('open-game-select');

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
			config.dropdownMenuItems = {
				skse: { id: 'launchSKSE', title: 'Launch SKSE' }
			};
			writeConfig();
			debug(config);
		} else if (config.skseFound === false) {
			writeConfig();
			config.dropdownMenuItems = {
				skse: { id: 'installSKSE', title: 'Install SKSE' }
			};
			writeConfig();
			debug(`skseFound: ${config.skseFound}`);
			debug(config);
		}
	}
}

// import dropdown menu items
getConfig();
getPlugins();

document.getElementById('dropdownLabel').innerText =
	config.dropdownMenuItems.lastSelected.label;

newDropdownEl(
	config.dropdownMenuItems.skse.id,
	config.dropdownMenuItems.skse.title
);

newDropdownEl('launchSkyrimSE', 'Launch Skyrim Special Edition');
// /home/ashnwor/.steam/steam/steamapps/compatdata/489830/pfx/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition
