let dir;
let rawConfig;
let rightMenu;
let lines;
let config;
let i;
const debug = debugThis => window.globalDebug(debugThis);

const getConfig = () => {
	rawConfig = window.fs.readFileSync(`${dir}/${window.appName}/config.json`);
	config = JSON.parse(rawConfig);
};

const writeConfig = () => {
	window.fs.writeFileSync(`${dir}/${window.appName}/config.json`, JSON.stringify(config, null, 4), err => {
		if (err) throw err;
		debug('The file has been saved!');
	});
	getConfig();
};

const isItPlugin = line => {
	if (line[0] === '#') {
		debug(`${line} COMMENT`);
	} else if (
		line[0] !== '*' &&
		`${line[line.length - 3]}${line[line.length - 2]}${line[line.length - 1]}` === 'esp'
	) {
		debug(`${line} PLUGIN, NOT ACTIVE`);
		// eslint-disable-next-line no-use-before-define
		newRightMenuEl(line, false);
	} else if (
		line[0] === '*' &&
		`${line[line.length - 3]}${line[line.length - 2]}${line[line.length - 1]}` === 'esp'
	) {
		debug(`${line} PLUGIN, ACTIVE`);
		// eslint-disable-next-line no-use-before-define
		newRightMenuEl(line, true);
	}
};

const getPlugins = () => {
	rightMenu = document.getElementById('rightMenuList');
	rightMenu.innerHTML = '';
	// Get this from preload in relation to selected game
	const skyrimSEid = 489830;
	const pfx = `${config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`;
	const pluginsDir = `${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`;

	debug(pluginsDir);
	const pluginsFile = window.fs.readFileSync(`${pluginsDir}/Plugins.txt`, 'utf8');

	lines = [];
	pluginsFile.split(/\r?\n/).forEach(line => {
		lines.push(line);
	});
	debug(lines);
	for (i = 0; i < lines.length; i += 1) {
		isItPlugin(lines[i]);
	}
};

const writePlugins = arr => {
	const skyrimSEid = 489830;
	const pfx = `${config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`;
	const pluginsDir = `${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`;
	debug(pluginsDir);
	const pluginsFile = `${pluginsDir}/Plugins.txt`;

	window.fs.writeFileSync(pluginsFile, arr.join('\n'), function(err) {
		debug(err ? `Error :${err}` : 'ok');
	});
	getPlugins();
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

const newDropdownEl = (id, label) => {
	const dropdownMenu = document.getElementById('dropdownMenu');
	const dropdownEl = document.createElement('a');
	dropdownEl.id = id;
	dropdownEl.classList.add('dropdown-item');
	dropdownEl.innerText = label;
	dropdownEl.onclick = () => {
		document.getElementById('dropdownLabel').innerText = label;
		getConfig();
		config.dropdownMenuItems.lastSelected = { id, label };
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

	const runArr = [];
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
			debug(err ? `Error :${err}` : 'ok');
		});
		window.execSync('chmod +x runSKSE');
	} else if (skse === false) {
		window.fs.writeFileSync('runSkyrim', runArr.join('\n'), function(err) {
			debug(err ? `Error :${err}` : 'ok');
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
		const map = window.fs.readFileSync(`${dir}/${window.appName}/protonMap.json`, 'utf8');
		debug(JSON.parse(map));
	}
};

// First start
// if (window.platform === 'linux') {
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
	const dirArr = window.fs.readdirSync(config.skyrimSE);
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
			skse: { id: 'launchSKSE', title: 'Launch SKSE' },
		};
		writeConfig();
		debug(config);
	} else if (config.skseFound === false) {
		writeConfig();
		config.dropdownMenuItems = {
			skse: { id: 'installSKSE', title: 'Install SKSE' },
		};
		writeConfig();
		debug(`skseFound: ${config.skseFound}`);
		debug(config);
	}
	config.dropdownMenuItems.lastSelected = {
		id: config.dropdownMenuItems.skse.id,
		label: config.dropdownMenuItems.skse.title,
	};

	config.protonVersion = { location: null, text: null };
	writeConfig();
}
// }

// import dropdown menu items
getConfig();
getPlugins();

document.getElementById('dropdownLabel').innerText = config.dropdownMenuItems.lastSelected.label;

newDropdownEl(config.dropdownMenuItems.skse.id, config.dropdownMenuItems.skse.title);

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
			} else if (config.dropdownMenuItems.lastSelected.id === 'launchSkyrimSE') {
				child = window.spawn('./runSkyrim', { stdio: 'inherit' });
			}
			debug(`Process PID: ${child.pid}`);
			if (child.pid !== null) {
				isRunning = true;
				debug(`isRunning: ${isRunning}`);
			}

			child.on('exit', function(code) {
				debug(`Process finished with code: ${code}`);
				isRunning = false;
				debug(`isRunning: ${isRunning}`);
			});
		}
	}
});

const compareGame = game => {
	if (game === 'SkyrimSE') return 'skyrimspecialedition';
};

const createTripleColumn = (idPrefix, firstNode, secondNode, thirdNode) => {
	const container = document.createElement('div');
	container.classList.add('container-fluid');
	const row = document.createElement('div');
	row.classList.add('row');
	for (i = 1; i <= 3; i += 1) {
		const column = document.createElement('div');
		column.id = `${idPrefix}-${i}`;
		column.classList.add('col-sm');
		column.style = `overflow:hidden; text-overflow:ellipsis;`;
		if (i === 1) column.appendChild(firstNode);
		if (i === 2) column.appendChild(secondNode);
		if (i === 3) column.appendChild(thirdNode);
		row.appendChild(column);
	}
	container.appendChild(row);
	return container;
};

const createTextNode = text => {
	const textNode = document.createElement('span');
	textNode.innerText = text.toString().substr(0, 50);
	textNode.classList.add('textNode');
	return textNode;
};

const createImgButtonNode = (id, title, img, hoverImg) => {
	const imgNode = document.createElement('img');
	imgNode.src = img;
	imgNode.title = title;
	if (hoverImg) {
		imgNode.addEventListener('mouseover', () => {
			imgNode.src = hoverImg;
		});
		imgNode.addEventListener('mouseleave', () => {
			imgNode.src = img;
		});
	}
	imgNode.classList.add('clickable');
	return imgNode;
};

const createDownloadListItem = (filename, fileid, filesize) => {
	document.getElementById('noDownload').style = `display: none;`;
	const downloadList = document.getElementById('downloadList');
	const downloadListItem = document.createElement('li');
	downloadListItem.classList.add('list-group-item', 'downloadListItem', 'position-relative', 'active');
	downloadListItem.style = `max-height: 24px;`;
	const progressOuterDiv = document.createElement('div');
	progressOuterDiv.classList.add('progress', 'verticalCenter');
	progressOuterDiv.style = `height: 80%; width: 100%; border-radius: 0 !important;`;
	const progressInnerDiv = document.createElement('div');
	progressInnerDiv.id = 'prog-bar';
	progressInnerDiv.classList.add('progress-bar', 'bg-success');
	progressOuterDiv.appendChild(progressInnerDiv);
	const tempNode2 = document.createElement('span');
	tempNode2.innerText = 'TEMP NODE';
	downloadListItem.appendChild(
		createTripleColumn(
			fileid,
			createTextNode(filename),
			progressOuterDiv,
			createTripleColumn(
				`${fileid}-3`,
				createTextNode(filesize),
				createTextNode('speed'),
				createTripleColumn(
					`${fileid}-3-3`,
					createImgButtonNode(
						null,
						'Open Folder',
						'../images/folder.svg',
						'../images/folder-fill.svg'
					),
					createImgButtonNode(null, 'Install', '../images/wrench.svg', null),
					createImgButtonNode(
						null,
						'Delete',
						'../images/x-circle.svg',
						'../images/x-circle-fill.svg'
					)
				)
			)
		)
	);
	downloadList.insertBefore(downloadListItem, downloadList.firstChild);
};

const updateProgress = (id, value) => {
	document.getElementById(id).getElementsByClassName('progress-bar')[0].style.width = `${value}%`;
};

const updateProgressText = (id, value) => {
	document.getElementById(id).getElementsByClassName('textNode')[0].innerText = `${value}%`;
};

const getDownloadHistory = () => {
	if (window.fs.existsSync(`${dir}/${window.appName}/downloadHistory.json`)) {
		let history = window.fs.readFileSync(`${dir}/${window.appName}/downloadHistory.json`, 'utf8');
		history = JSON.parse(history);
		debug(history.length);
		let index;
		for (index = 0; index < history.length; index += 1) {
			debug(index);
			createDownloadListItem(
				history[index].filename,
				history[index].fileid,
				`${history[index].roundedFilesizeInMB}MB`
			);
			updateProgress(`${history[index].fileid}-2`, 100);
			updateProgressText(`${history[index].fileid}-3-2`, 100);
		}
	}
};
getDownloadHistory();

const showClearHistory = () => {
	document.getElementById('downloadsButton').classList.add('downloadsBtn-clicked');
	document.getElementById('clearHistory').classList.add('display-initial');
	document.getElementById('downloadsText').style = `margin-left: 5vh;`;
};

const hideClearHistory = () => {
	document.getElementById('downloadsButton').classList.remove('downloadsBtn-clicked');
	document.getElementById('clearHistory').classList.remove('display-initial');
	document.getElementById('downloadsText').style = ``;
};

document.getElementById('downloadsButton').addEventListener('click', () => {
	if (document.getElementById('collapseOne').classList[1] !== 'show') {
		showClearHistory();
	} else {
		hideClearHistory();
	}
});
window.ipcRenderer.on('request-download', async (event, obj) => {
	document.getElementById('collapseOne').classList.add('show');
	showClearHistory();
	if (window.fs.existsSync(`${dir}/${window.appName}/apikey`)) {
		const apiKey = window.fs.readFileSync(`${dir}/${window.appName}/apikey`);
		debug(obj);
		let parsedModInfo;
		let filename;
		let fileid;
		let modid;
		let modname;
		let downloadURL;
		window.request('GET', `https://api.nexusmods.com/v1/games/${compareGame(obj.game)}/mods/${obj.modID}`, {
			headers: { apikey: apiKey },
		}).done(resp0 => {
			debug(JSON.parse(resp0.getBody().toString()));
			parsedModInfo = JSON.parse(resp0.getBody().toString());
			modid = parsedModInfo.mod_id;
			modname = parsedModInfo.name;
			window.request(
				'GET',
				`https://api.nexusmods.com/v1/games/${compareGame(obj.game)}/mods/${obj.modID}/files/${
					obj.fileID
				}.json`,
				{
					headers: { apikey: apiKey },
				}
			).done(resp1 => {
				debug(JSON.parse(resp1.getBody().toString()));
				const parsedFileInfo = JSON.parse(resp1.getBody().toString());
				filename = parsedFileInfo.file_name;
				fileid = parsedFileInfo.file_id;
				debug(filename);
				window.request(
					'GET',
					`https://api.nexusmods.com/v1/games/${compareGame(obj.game)}/mods/${
						obj.modID
					}/files/${obj.fileID}/download_link.json?key=${obj.key}&expires=${obj.expires}`,
					{
						headers: { apikey: apiKey },
					}
				).done(resp2 => {
					debug(JSON.parse(resp2.getBody().toString()));
					const parsedDownloadData = JSON.parse(resp2.getBody().toString());
					downloadURL = parsedDownloadData[0].URI;
					let roundedFilesizeInMB;

					debug(downloadURL);
					if (!window.fs.existsSync(`${dir}/${window.appName}/mods`))
						window.fs.mkdirSync(`${dir}/${window.appName}/mods`);
					// might switch to real wget or curl later
					const download = window.wget.download(
						downloadURL,
						`${dir}/${window.appName}/mods/${filename}`
					);
					download.on('start', function(filesize) {
						roundedFilesizeInMB = Math.round((filesize / 1000000) * 10) / 10;
						createDownloadListItem(filename, fileid, `${roundedFilesizeInMB}MB`);
					});

					download.on('progress', progress => {
						const prog100 = progress * 100;
						updateProgress(`${fileid}-2`, prog100.toFixed(0));
						updateProgressText(`${fileid}-3-2`, prog100.toFixed(0));
					});

					download.on('end', () => {
						let downloadHistory;
						if (
							!window.fs.existsSync(
								`${dir}/${window.appName}/downloadHistory.json`
							)
						) {
							downloadHistory = [];
						} else {
							downloadHistory = window.fs.readFileSync(
								`${dir}/${window.appName}/downloadHistory.json`,
								'utf8'
							);
						}
						downloadHistory = JSON.parse(downloadHistory);
						debug('DOWNLOAD ENDED');
						downloadHistory.push({
							modid,
							modname,
							fileid,
							filename,
							roundedFilesizeInMB,
						});
						debug(downloadHistory);
						window.fs.writeFileSync(
							`${dir}/${window.appName}/downloadHistory.json`,
							JSON.stringify(downloadHistory, null, 4),
							err => {
								if (err) throw err;
								debug('The file has been saved!');
							}
						);
					});
				});
			});
		});
	} else {
		window.dialog.showErrorBox("Couldn't find the api key", 'Please enter a api key from preferences');
	}
});
