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

const genRunScript = skse => {
	getConfig();
	let runnerPath;
	if (config.protonVersion.location === 'common') {
		runnerPath = `/home/${window.getUsername}/.steam/steam/steamapps/common/${config.protonVersion.version}`;
	} else if (config.protonVersion.location === 'compatibilitytools') {
		runnerPath = `/home/${window.getUsername}/.steam/steam/compatibilitytools.d/${config.protonVersion.version}`;
	} else if (config.protonVersion.location === 'null') {
		window.dialog.showErrorBox(
			'Proton',
			'No proton version selected. Please select a proton version from preferences'
		);
		return;
	}

	let runArr = [];
	runArr[0] = '#!/bin/bash';
	runArr[1] = '#Run game or given command in environment';
	runArr[2] = '';
	runArr[3] = `cd "${config.skyrimSE}"`;
	if (skse === true) {
		// for true: generate for skse64
		runArr[4] = `DEF_CMD=("${config.skyrimSE}/skse64_loader.exe")`;
	} else {
		// for false: generate for skyrim
		runArr[4] = `DEF_CMD=("${config.skyrimSE}/SkyrimSE.exe")`;
	}
	runArr[5] = `PATH="${runnerPath}/dist/bin/:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/amd64/bin:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/amd64/usr/bin:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/usr/bin:/usr/local/bin:/usr/local/sbin:/usr/bin" \\`;
	runArr[6] = `TERM="xterm" \\`;
	runArr[7] = `WINEDEBUG="-all" \\`;
	runArr[8] = `        LD_PRELOAD="/usr/$LIB/libgamemodeauto.so.0::/home/${window.getUsername}/.steam/steam/ubuntu12_32/gameoverlayrenderer.so:/home/${window.getUsername}/.steam/steam/ubuntu12_64/gameoverlayrenderer.so" \\`;
	runArr[9] = `        WINEDLLPATH="${runnerPath}/dist/lib64//wine:${runnerPath}/dist/lib//wine" \\`;
	runArr[10] = `        LD_LIBRARY_PATH="${runnerPath}/dist/lib64/:${runnerPath}/dist/lib/:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/pinned_libs_32:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/pinned_libs_64:/usr/lib/libfakeroot:/usr/lib32:/usr/lib/openmpi:/usr/lib:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/lib/i386-linux-gnu:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/usr/lib/i386-linux-gnu:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/lib/x86_64-linux-gnu:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/usr/lib/x86_64-linux-gnu:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/lib:/home/${window.getUsername}/.steam/steam/ubuntu12_32/steam-runtime/usr/lib:" \\`;
	runArr[11] = `	      WINEPREFIX="/home/${window.getUsername}/.steam/steam/steamapps/compatdata/489830/pfx/" \\`;
	runArr[12] = `	      WINEESYNC="1" \\`;
	runArr[13] = `        SteamGameId="489830" \\`;
	runArr[14] = `	      SteamAppId="489830" \\`;
	runArr[15] = `	      WINEDLLOVERRIDES="xaudio2_7=n,b;steam.exe=b;mfplay=n;dxvk_config=n;d3d11=n;d3d10=n;d3d10core=n;d3d10_1=n" \\`;
	runArr[16] = `        STEAM_COMPAT_CLIENT_INSTALL_PATH="/home/${window.getUsername}/.steam/steam" \\`;
	runArr[17] = `	      "${runnerPath}/dist/bin/wine" steam.exe "\${@:-\${DEF_CMD[@]}}"`;
	debug(runArr);
	debug(runArr[17]);
	if (skse === true) {
		window.fs.writeFileSync('runSKSE', runArr.join('\n'), function(err) {
			console.log(err ? 'Error :' + err : 'ok');
		});
		window.execSync('chmod +x runSKSE');
	} else if (skse === false) {
		window.fs.writeFileSync('runSkyrim', runArr.join('\n'), function(err) {
			console.log(err ? 'Error :' + err : 'ok');
		});
		window.execSync('chmod +x runSkyrim');
	}
};

const genProtonMap = () => {
	let id = -1;
	const protonMap = {};
	protonMap.common = {};
	if (window.platform === 'linux') {
		const steamAppsCommon = `/home/${window.getUsername}/.steam/steam/steamapps/common`;
		window.fs.readdirSync(steamAppsCommon).forEach(file => {
			debug(file);
			if (file.includes('Proton') === true) {
				if (
					window.fs.existsSync(
						`/home/${window.getUsername}/.steam/steam/steamapps/common/${file}/proton`
					)
				) {
					protonMap.common[id + 1] = { name: file };
					id += 1;
				}
			}
		});
		const compatibilitytools = `/home/${window.getUsername}/.steam/steam/compatibilitytools.d`;
		if (window.fs.existsSync(compatibilitytools) === true) {
			protonMap.compatibilitytools = {};
			id = -1;
			window.fs.readdirSync(compatibilitytools).forEach(file => {
				debug(file);
				if (file.includes('Proton') === true) {
					if (
						window.fs.existsSync(
							`/home/${window.getUsername}/.steam/steam/compatibilitytools.d/${file}/proton`
						)
					) {
						protonMap.compatibilitytools[id + 1] = { name: file };
						id += 1;
					}
				}
			});
		}
		window.fs.writeFileSync(
			`${dir}/${window.appName}/protonMap.json`,
			JSON.stringify(protonMap, null, 4),
			err => {
				if (err) throw err;
				debug('The file has been saved!');
			}
		);
		const map = window.fs.readFileSync(
			`${dir}/${window.appName}/protonMap.json`,
			'utf8'
		);
		debug(JSON.parse(map));
	}
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

	config.protonVersion = { location: null, text: null };
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

if (window.platform === 'linux') {
	// TODO: Will change the way of genRunScript works later
	genRunScript(true); // generate run script for skse
	genRunScript(false); // generate run script for skyrimse
	window.ipcRenderer.on('gen-run-script', () => {
		genRunScript();
	});
}

genProtonMap();
let isRunning = false;

document.getElementById('preferences').addEventListener('click', () => {
	window.ipcRenderer.send('open-prefs');
});

document.getElementById('run').addEventListener('click', () => {
	getConfig();
	if (isRunning === true) {
		debug('Already running');
	}
	if (isRunning === false) {
		if (window.platform === 'linux') {
			let child;
			// TODO: Support for custom dropdown menu items
			if (config.dropdownMenuItems.lastSelected.id === 'launchSKSE') {
				child = window.spawn('./runSKSE', { stdio: 'inherit' });
			} else if (
				config.dropdownMenuItems.lastSelected.id === 'launchSkyrimSE'
			) {
				child = window.spawn('./runSkyrim', { stdio: 'inherit' });
			}
			debug(`Process PID: ${child.pid}`);
			if (child.pid !== null) {
				isRunning = true;
				debug(`isRunning: ${isRunning}`);
			}

			child.on('exit', function(code, signal) {
				debug(`Process finished with code: ${code}`);
				isRunning = false;
				debug(`isRunning: ${isRunning}`);
			});
		}
	}
});

window.ipcRenderer.on('request-download', (event, obj) => {
	if (window.fs.existsSync(`${dir}/${window.appName}/apikey`)) {
		debug(obj);
		const options = {
			host: 'api.nexusmods.com',
			port: 443,
			path: `/v1/games/skyrimspecialedition/mods/${obj['modID']}`,
			method: 'GET',
			headers: {
				apikey: window.fs.readFileSync(`${dir}/${window.appName}/apikey`)
			}
		};
		window.https.get(options, resp => {
			let data = '';
			resp.on('data', chunk => {
				data += chunk;
			});

			resp.on('end', () => {
				debug(JSON.parse(data));
			});
		});
	} else {
		window.dialog.showErrorBox(
			"Couldn't find the api key",
			'Please enter a api key from preferences'
		);
	}
});
