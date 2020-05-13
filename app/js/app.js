let dir;
let rightMenu;
let lines;
let config;
let i;
const debug = debugThis => window.globalDebug(debugThis);

const {
	request,
	shell,
	wget,
	spawn,
	execSync,
	platform,
	dialog,
	ipcRenderer,
	appName,
	fs,
	os,
	join,
	extname,
	sevenz,
	getCurrentWindow,
} = window;

// TODO: Import protonSupport only on linux
const { configFunctions, protonSupport, layoutApp } = window;

const { homedir } = os;

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
	const pfx = join(`${config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`);
	const pluginsDir = join(
		`${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`
	);

	debug(pluginsDir);
	const pluginsFile = fs.readFileSync(join(`${pluginsDir}/Plugins.txt`), 'utf8');

	lines = [];
	pluginsFile.split(/\r?\n/).forEach(line => {
		lines.push(line);
	});
	lines = lines.filter(value => value !== '');
	debug(lines);
	for (i = 0; i < lines.length; i += 1) {
		isItPlugin(lines[i]);
	}
};

const writePlugins = arr => {
	const skyrimSEid = 489830;
	const pfx = join(`${config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`);
	const pluginsDir = join(
		`${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`
	);
	debug(pluginsDir);
	const pluginsFile = join(`${pluginsDir}/Plugins.txt`);

	fs.writeFileSync(pluginsFile, arr.join('\n'), function(err) {
		debug(err ? `Error :${err}` : 'ok');
	});
	getPlugins();
};

const addPlugin = espArr => {
	getPlugins();
	espArr.forEach(value => {
		if (!lines.includes(value) && !lines.includes(`*${value}`)) lines[lines.length] = value;
	});
	debug(lines);
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
		if (!checkboxEl.checked) {
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
		config = configFunctions.getConfig();
		config.dropdownMenuItems.lastSelected = { id, label };
		configFunctions.writeConfig(config);
		config = configFunctions.getConfig();
	};
	dropdownMenu.appendChild(dropdownEl);
};

// First start
// if (platform === 'linux') {
const firstStart = ipcRenderer.sendSync('isFirstStart');
if (platform === 'darwin') {
	dir = `${homedir}/Library/Application Support`;
} else if (platform === 'linux') {
	dir = `${homedir}/.local/share`;
}
if (firstStart) {
	debug('First time setup');
	config = configFunctions.getConfig();
	config.skseFound = false;
	const dirArr = fs.readdirSync(config.skyrimSE);
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

	if (config.skseFound) {
		debug(`skseFound: ${config.skseFound}`);
		configFunctions.writeConfig(config);
		config.dropdownMenuItems = {
			skse: { id: 'launchSKSE', title: 'Launch SKSE' },
		};
		configFunctions.writeConfig(config);
		debug(config);
	} else {
		configFunctions.writeConfig(config);
		config.dropdownMenuItems = {
			skse: { id: 'installSKSE', title: 'Install SKSE' },
		};
		configFunctions.writeConfig(config);
		debug(`skseFound: ${config.skseFound}`);
		debug(config);
	}
	config.dropdownMenuItems.lastSelected = {
		id: config.dropdownMenuItems.skse.id,
		label: config.dropdownMenuItems.skse.title,
	};

	config.protonVersion = { location: null, text: null };
	configFunctions.writeConfig(config);
}

if (platform === 'linux') {
	// TODO: Will change the way of genRunScript works later
	protonSupport.genRunScript(true); // generate run script for skse
	protonSupport.genRunScript(false); // generate run script for skyrimse
	ipcRenderer.on('gen-run-script', () => {
		protonSupport.genRunScript();
	});
	protonSupport.genProtonMap();
}

let isRunning = false;

document.getElementById('preferences').addEventListener('click', () => {
	ipcRenderer.send('open-prefs');
});

document.getElementById('run').addEventListener('click', () => {
	config = configFunctions.getConfig();
	if (isRunning) {
		debug('Already running');
	}
	if (!isRunning) {
		if (platform === 'linux') {
			let child;
			// TODO: Support for custom dropdown menu items
			if (config.dropdownMenuItems.lastSelected.id === 'launchSKSE') {
				child = spawn('./runSKSE', { stdio: 'inherit' });
			} else if (config.dropdownMenuItems.lastSelected.id === 'launchSkyrimSE') {
				child = spawn('./runSkyrim', { stdio: 'inherit' });
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

const openFolder = filename => {
	shell.showItemInFolder(join(`${dir}/${appName}/mods/${filename}`));
	debug(`${dir}/${appName}/mods/${filename}`);
};

const isExists = directory => {
	if (fs.existsSync(directory)) return true;
	if (!fs.existsSync(directory)) return false;
};

const installedModsJSON = `${dir}/${appName}/mods/installedMods.json`;
const retrieveMods = () => {
	let installedMods;
	if (isExists(installedModsJSON)) {
		installedMods = JSON.parse(fs.readFileSync(join(`${dir}/${appName}/mods/installedMods.json`), 'utf8'));
	} else {
		installedMods = [];
	}
	for (i = 0; i < installedMods.length; i += 1) {
		debug(installedMods[i]);
		layoutApp.createModsListItem(
			null,
			installedMods[i].modname,
			installedMods[i].version,
			installedMods[i].priority
		);
	}
};

const installMod = (filename, modname, modversion) => {
	debug(`mod version: ${modversion}`);
	let installedMods;

	if (isExists(installedModsJSON)) {
		installedMods = JSON.parse(fs.readFileSync(join(`${dir}/${appName}/mods/installedMods.json`), 'utf8'));
	} else {
		installedMods = [];
	}
	// Exit function if mod already installed
	if (isExists(installedModsJSON))
		for (i = 0; i - 1 <= installedMods.length; i += 1) {
			// TODO: 'Do you want to reinstall?' dialog
			// TODO: Check whether the mod installed or not with mod id rather than mod name
			if (installedMods[i].modname === modname) {
				dialog.showErrorBox('Error', 'Mod already installed');
				return;
			}
		}
	const isFomod = directory => directory.includes('Fomod');
	const modsFolder = join(`${dir}/${appName}/mods`);

	const copyToModsFolder = from => {
		if (platform === 'linux' || platform === 'darwin') {
			if (fs.existsSync(`${dir}/${appName}/mods/${modname}`))
				execSync(`rm -rf "${dir}/${appName}/mods/${modname}"`);
			execSync(`cp -R "${from}" "${dir}/${appName}/mods/${modname}"`);
			execSync(`rm -rf "${os.tmpdir()}/arcus-extract/${filename}"`);
		}
	};

	const registerMod = modFolder => {
		const findEsp = directory => {
			const arr = fs.readdirSync(directory);
			const esps = arr.filter(value => extname(value) === '.esp');
			return esps;
		};

		const modObj = {
			id: installedMods.length + 1,
			modname,
			enabled: 0,
			version: modversion,
			priority: 0,
			submods: {},
		};

		installedMods.push(modObj);
		fs.writeFileSync(
			join(`${dir}/${appName}/mods/installedMods.json`),
			JSON.stringify(installedMods, null, 4),
			err => {
				if (err) throw err;
				debug('The file has been saved!');
			}
		);
		addPlugin(findEsp(modFolder));
		writePlugins(lines);
		layoutApp.createModsListItem(null, modname, modversion, modObj.priority);
	};

	const promise = new Promise((resolve, reject) => {
		sevenz.extractFull(
			join(`${modsFolder}/${filename}`),
			join(`${os.tmpdir()}/arcus-extract/${filename}`),
			{
				$progress: true,
			}
		)
			.on('progress', progress => {
				debug(progress.percent);
			})

			.on('end', () => resolve('done'))
			.on('error', err => reject(err));
	});
	// Couldn't find another way to execute codes after async function
	// probably will change it when found a better way
	promise.then(respond => {
		debug(respond);
		// point extracted files
		const directory = fs.readdirSync(join(`${os.tmpdir()}/arcus-extract/${filename}`));
		debug(directory);
		if (isFomod(directory)) {
			// TODO: Add fomod support
			dialog.showErrorBox('Fomod', 'Fomod is not supported yet');
		} else {
			// data files contents
			const dataDirs = ['textures', 'meshes', 'sound'];
			const dataFiles = ['.esp', '.esl', '.bsa'];
			let isDataDir = false;

			// check if selected folder contents include one of typical contents of data folder
			for (i = 0; i <= directory.length - 1; i += 1) {
				if (
					dataFiles.includes(extname(directory[i])) ||
					dataDirs.includes(directory[i].toLowerCase())
				) {
					isDataDir = true;
					break;
				}
			}

			if (isDataDir) {
				debug(`isDataDir: ${isDataDir}`);
				copyToModsFolder(`${os.tmpdir()}/arcus-extract/${filename}`);
				registerMod(`${dir}/${appName}/mods/${modname}`);
			} else {
				// if initial files are not data contents
				// make the user select a folder
				debug(`isDataDir: ${isDataDir}`);
				const defaultPath = `${os.tmpdir()}/arcus-extract/${filename}`;
				const selectedPath = dialog.showOpenDialogSync(getCurrentWindow(), {
					properties: ['openDirectory', 'showHiddenFiles'],
					defaultPath,
				})[0];
				debug(selectedPath);
				const selectedDir = fs.readdirSync(selectedPath);

				// check if selected folder contents include one of typical contents of data folder
				for (i = 0; i <= selectedDir.length - 1; i += 1) {
					if (
						dataFiles.includes(extname(selectedDir[i])) ||
						dataDirs.includes(selectedDir[i].toLowerCase())
					) {
						isDataDir = true;
						break;
					}
				}
				// if selected directory contains data files
				// move to mods folder
				if (isDataDir) {
					debug(`isDataDir: ${isDataDir}`);
					copyToModsFolder(selectedPath);
					registerMod(`${dir}/${appName}/mods/${modname}`);
				} else {
					dialog.showErrorBox('Error', 'Selected directory is not data folder');
				}
			}
		}
	});
};

const deleteMod = () => {
	debug('Delete Mod');
};

// TODO: Bad code, refactor
const createDownloadListItem = (filename, fileid, filesize, modname, modversion) => {
	debug(`dlist modversion: ${modversion}`);
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
	downloadListItem.appendChild(
		layoutApp.createTripleColumn(
			fileid,
			layoutApp.createTextNode(filename),
			progressOuterDiv,
			layoutApp.createTripleColumn(
				`${fileid}-3`,
				layoutApp.createTextNode(filesize),
				layoutApp.createTextNode(''),
				layoutApp.createTripleColumn(
					`${fileid}-3-3`,
					layoutApp.createImgButtonNode(
						null,
						'Open Folder',
						join('../images/folder.svg'),
						join('../images/folder-fill.svg'),
						filename,
						null,
						null,
						openFolder
					),
					layoutApp.createImgButtonNode(
						null,
						'Install',
						join('../images/wrench.svg'),
						null,
						filename,
						modname,
						modversion,
						installMod
					),
					layoutApp.createImgButtonNode(
						null,
						'Delete',
						join('../images/x-circle.svg'),
						join('../images/x-circle-fill.svg'),
						null,
						null,
						null,
						deleteMod
					)
				)
			)
		)
	);
	downloadList.insertBefore(downloadListItem, downloadList.firstChild);
};

const getDownloadHistory = () => {
	if (fs.existsSync(join(`${dir}/${appName}/downloadHistory.json`))) {
		let history = fs.readFileSync(join(`${dir}/${appName}/downloadHistory.json`), 'utf8');
		history = JSON.parse(history);
		debug(history.length);
		let index;
		const fileList = [];
		for (index = 0; index < history.length; index += 1) {
			// check if entry's file existing in mods directory and not a duplicate entry
			if (
				fs.existsSync(`${dir}/${appName}/mods/${history[index].filename}`) &&
				!fileList.includes(history[index].fileid)
			) {
				fileList.push(history[index].fileid);
				debug(index);
				createDownloadListItem(
					history[index].filename,
					history[index].fileid,
					`${history[index].roundedFilesizeInMB}MB`,
					history[index].modname,
					history[index].modversion
				);
				layoutApp.updateProgress(`${history[index].fileid}-2`, 100);
				layoutApp.updateProgressText(`${history[index].fileid}-3-2`, 100);
			} else {
				debug(`Ignoring invalid history entry: ${history[index].fileid}`);
			}
		}
	}
};

document.getElementById('downloadsButton').addEventListener('click', () => {
	if (document.getElementById('collapseOne').classList[1] !== 'show') {
		layoutApp.showClearHistory();
	} else {
		layoutApp.hideClearHistory();
	}
});

const initDropdown = () => {
	document.getElementById('dropdownLabel').innerText = config.dropdownMenuItems.lastSelected.label;

	newDropdownEl(config.dropdownMenuItems.skse.id, config.dropdownMenuItems.skse.title);

	newDropdownEl('launchSkyrimSE', 'Launch Skyrim Special Edition');
};

// TODO?: seperate js file for init
const init = () => {
	getDownloadHistory();
	retrieveMods();
	config = configFunctions.getConfig();
	getPlugins();
	initDropdown();
};

ipcRenderer.on('request-download', async (event, obj) => {
	document.getElementById('collapseOne').classList.add('show');
	layoutApp.showClearHistory();
	if (fs.existsSync(join(`${dir}/${appName}/apikey`))) {
		const apiKey = fs.readFileSync(join(`${dir}/${appName}/apikey`));
		debug(obj);
		let parsedModInfo;
		let filename;
		let fileid;
		let modversion;
		let modid;
		let modname;
		let downloadURL;
		request('GET', `https://api.nexusmods.com/v1/games/${obj.game}/mods/${obj.modID}`, {
			headers: { apikey: apiKey },
		}).done(resp0 => {
			debug(JSON.parse(resp0.getBody().toString()));
			parsedModInfo = JSON.parse(resp0.getBody().toString());
			modid = parsedModInfo.mod_id;
			modname = parsedModInfo.name;
			request(
				'GET',
				`https://api.nexusmods.com/v1/games/${obj.game}/mods/${obj.modID}/files/${obj.fileID}.json`,
				{
					headers: { apikey: apiKey },
				}
			).done(resp1 => {
				debug(JSON.parse(resp1.getBody().toString()));
				const parsedFileInfo = JSON.parse(resp1.getBody().toString());
				filename = parsedFileInfo.file_name;
				fileid = parsedFileInfo.file_id;
				modversion = parsedFileInfo.mod_version;
				debug(filename);
				request(
					'GET',
					`https://api.nexusmods.com/v1/games/${obj.game}/mods/${obj.modID}/files/${obj.fileID}/download_link.json?key=${obj.key}&expires=${obj.expires}`,
					{
						headers: { apikey: apiKey },
					}
				).done(resp2 => {
					debug(JSON.parse(resp2.getBody().toString()));
					const parsedDownloadData = JSON.parse(resp2.getBody().toString());
					downloadURL = parsedDownloadData[0].URI;
					let roundedFilesizeInMB;

					debug(downloadURL);
					if (!fs.existsSync(join(`${dir}/${appName}/mods`)))
						fs.mkdirSync(join(`${dir}/${appName}/mods`));
					// might switch to real wget or curl later
					const download = wget.download(
						downloadURL,
						join(`${dir}/${appName}/mods/${filename}`)
					);
					download.on('start', function(filesize) {
						roundedFilesizeInMB = Math.round((filesize / 1000000) * 10) / 10;
						debug(`download start: m_version: ${modversion}`);
						createDownloadListItem(
							filename,
							fileid,
							`${roundedFilesizeInMB}MB`,
							modname,
							modversion
						);
					});

					download.on('progress', progress => {
						const prog100 = progress * 100;
						layoutApp.updateProgress(`${fileid}-2`, prog100.toFixed(0));
						layoutApp.updateProgressText(`${fileid}-3-2`, prog100.toFixed(0));
					});

					download.on('end', () => {
						let downloadHistory;
						if (!fs.existsSync(join(`${dir}/${appName}/downloadHistory.json`))) {
							downloadHistory = [];
						} else {
							downloadHistory = fs.readFileSync(
								join(`${dir}/${appName}/downloadHistory.json`),
								'utf8'
							);
							downloadHistory = JSON.parse(downloadHistory);
						}
						debug('DOWNLOAD ENDED');
						downloadHistory.push({
							modid,
							modname,
							modversion,
							fileid,
							filename,
							roundedFilesizeInMB,
						});
						debug(downloadHistory);
						fs.writeFileSync(
							join(`${dir}/${appName}/downloadHistory.json`),
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
		dialog.showErrorBox("Couldn't find the api key", 'Please enter a api key from preferences');
	}
});

init();
