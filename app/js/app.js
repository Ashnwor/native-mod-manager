let dir;
let rawConfig;
let rightMenu;
let lines;
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

const newRightMenuEl = (label, check) => {
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
	checkboxEl.addEventListener('click', () => {
		debug(`${checkboxEl.id}: ${checkboxEl.checked}`);
		if (checkboxEl.checked === false) {
			debug(`${checkboxEl.id}: disabled`);
			for (i = 0; i < lines.length; i += 1) {
				if (lines[i] === checkboxEl.id) {
					lines[i] = checkboxEl.id.replace('*', '');
					writePlugins(lines);
					break;
				}
			}
		} else {
			debug(`${checkboxEl.id}: enabled`);
			for (i = 0; i < lines.length; i += 1) {
				if (lines[i] === checkboxEl.id) {
					lines[i] = `*${checkboxEl.id}`;
					writePlugins(lines);
					break;
				}
			}
		}
	});
	text.classList.add('custom-control-label');
	text.htmlFor = label;
	text.innerText = label.replace('*', '').replace('.esp', '');
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
		newRightMenuEl(line, true);
	}
};

const writePlugins = arr => {
	const skyrimSEid = 489830;
	const pfx = `${config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`;
	const pluginsDir = `${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`;
	debug(pluginsDir);
	const pluginsFile = `${pluginsDir}/Plugins.txt`;

	window.fs.writeFileSync(pluginsFile, arr.join('\n'), function(err) {
		console.log(err ? 'Error :' + err : 'ok');
	});
	getPlugins();
};

const getPlugins = () => {
	rightMenu = document.getElementById('rightMenuList');
	rightMenu.innerHTML = '';
	// Get this from preload in relation to selected game
	const skyrimSEid = 489830;
	const pfx = `${config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`;
	const pluginsDir = `${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`;

	debug(pluginsDir);
	const pluginsFile = window.fs.readFileSync(
		`${pluginsDir}/Plugins.txt`,
		'utf8'
	);

	lines = [];
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
//if (window.platform === 'linux') {
const firstStart = window.ipcRenderer.sendSync('isFirstStart');
if (window.platform === 'darwin') {
	dir = `/Users/${window.getUsername}/Library/Application Support`;
} else if (window.platform === 'linux') {
	dir = `/home/${window.getUsername}/.local/share`;
}
if (firstStart === true) {
	debug('First time setup');
	getConfig();
	config.skseFound = false;
	dirArr = window.fs.readdirSync(config['skyrimSE']);
	debug(config);

	config.isSteam = true;
	// TODO: Check if the game is in steam folder
	// This will needed when running the game

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
	config.dropdownMenuItems.lastSelected = {
		id: config.dropdownMenuItems.skse.id,
		label: config.dropdownMenuItems.skse.title
	};
	writeConfig();
}
//}

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

document.getElementById('run').addEventListener('click', () => {
	debug('RUNNNIIIINNNNNGGGG');
	if (window.platform === 'linux') {
		window.exec('steam steam://rungameid/489830');
	}
});
