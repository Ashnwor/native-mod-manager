let dir;

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
const { configFunctions, globalVariables, protonSupport, layoutApp, plugins, utils } = window;

const { homedir } = os;

// First start
// if (platform === 'linux') {
const firstStart = ipcRenderer.sendSync('isFirstStart');
if (platform === 'darwin') {
	dir = `${homedir}/Library/Application Support`;
} else if (platform === 'linux') {
	dir = `${homedir}/.local/share`;
}
if (firstStart) {
	utils.debug('First time setup');
	globalVariables.config = configFunctions.getConfig();
	globalVariables.config.skseFound = false;
	const dirArr = fs.readdirSync(globalVariables.config.skyrimSE);
	utils.debug(globalVariables.config);

	globalVariables.config.isSteam = true;
	// TODO: Check if the game is in steam folder
	// This will needed when running the game

	for (let i = 0; i < dirArr.length; i += 1) {
		if (dirArr[i].slice(0, 6) === 'skse64') {
			globalVariables.config.skseFound = true;
			// TODO: Add dropdown menu to start script extender
			break;
		}
	}

	if (globalVariables.config.skseFound) {
		utils.debug(`skseFound: ${globalVariables.config.skseFound}`);
		configFunctions.writeConfig(globalVariables.config);
		globalVariables.config.dropdownMenuItems = {
			skse: { id: 'launchSKSE', title: 'Launch SKSE' },
		};
		configFunctions.writeConfig(globalVariables.config);
		utils.debug(globalVariables.config);
	} else {
		configFunctions.writeConfig(globalVariables.config);
		globalVariables.config.dropdownMenuItems = {
			skse: { id: 'installSKSE', title: 'Install SKSE' },
		};
		configFunctions.writeConfig(globalVariables.config);
		utils.debug(`skseFound: ${globalVariables.config.skseFound}`);
		utils.debug(globalVariables.config);
	}
	globalVariables.config.dropdownMenuItems.lastSelected = {
		id: globalVariables.config.dropdownMenuItems.skse.id,
		label: globalVariables.config.dropdownMenuItems.skse.title,
	};

	globalVariables.config.protonVersion = { location: null, text: null };
	configFunctions.writeConfig(globalVariables.config);
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
	globalVariables.config = configFunctions.getConfig();
	if (isRunning) {
		utils.debug('Already running');
	}
	if (!isRunning) {
		if (platform === 'linux') {
			let child;
			// TODO: Support for custom dropdown menu items
			if (globalVariables.config.dropdownMenuItems.lastSelected.id === 'launchSKSE') {
				child = spawn('./runSKSE', { stdio: 'inherit' });
			} else if (globalVariables.config.dropdownMenuItems.lastSelected.id === 'launchSkyrimSE') {
				child = spawn('./runSkyrim', { stdio: 'inherit' });
			}
			utils.debug(`Process PID: ${child.pid}`);
			if (child.pid !== null) {
				isRunning = true;
				utils.debug(`isRunning: ${isRunning}`);
			}

			child.on('exit', function(code) {
				utils.debug(`Process finished with code: ${code}`);
				isRunning = false;
				utils.debug(`isRunning: ${isRunning}`);
			});
		}
	}
});

const openFolder = filename => {
	shell.showItemInFolder(join(`${dir}/${appName}/mods/${filename}`));
	utils.debug(`${dir}/${appName}/mods/${filename}`);
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
	for (let i = 0; i < installedMods.length; i += 1) {
		utils.debug(installedMods[i]);
		layoutApp.createModsListItem(
			null,
			installedMods[i].modname,
			installedMods[i].version,
			installedMods[i].priority
		);
	}
};

const installMod = (filename, modname, modversion) => {
	utils.debug(`mod version: ${modversion}`);
	let installedMods;

	if (isExists(installedModsJSON)) {
		installedMods = JSON.parse(fs.readFileSync(join(`${dir}/${appName}/mods/installedMods.json`), 'utf8'));
	} else {
		installedMods = [];
	}
	// Exit function if mod already installed
	if (isExists(installedModsJSON))
		for (let i = 0; i <= installedMods.length - 1; i += 1) {
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
				utils.debug('The file has been saved!');
			}
		);
		plugins.addPlugin(findEsp(modFolder));
		plugins.writePlugins(globalVariables.lines);
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
				utils.debug(progress.percent);
			})

			.on('end', () => resolve('done'))
			.on('error', err => reject(err));
	});
	// Couldn't find another way to execute codes after async function
	// probably will change it when found a better way
	promise.then(respond => {
		utils.debug(respond);
		// point extracted files
		const directory = fs.readdirSync(join(`${os.tmpdir()}/arcus-extract/${filename}`));
		utils.debug(directory);
		if (isFomod(directory)) {
			// TODO: Add fomod support
			dialog.showErrorBox('Fomod', 'Fomod is not supported yet');
		} else {
			// data files contents
			const dataDirs = ['textures', 'meshes', 'sound'];
			const dataFiles = ['.esp', '.esl', '.bsa'];
			let isDataDir = false;

			// check if selected folder contents include one of typical contents of data folder
			for (let i = 0; i <= directory.length - 1; i += 1) {
				if (
					dataFiles.includes(extname(directory[i])) ||
					dataDirs.includes(directory[i].toLowerCase())
				) {
					isDataDir = true;
					break;
				}
			}

			if (isDataDir) {
				utils.debug(`isDataDir: ${isDataDir}`);
				copyToModsFolder(`${os.tmpdir()}/arcus-extract/${filename}`);
				registerMod(`${dir}/${appName}/mods/${modname}`);
			} else {
				// if initial files are not data contents
				// make the user select a folder
				utils.debug(`isDataDir: ${isDataDir}`);
				const defaultPath = `${os.tmpdir()}/arcus-extract/${filename}`;
				const selectedPath = dialog.showOpenDialogSync(getCurrentWindow(), {
					properties: ['openDirectory', 'showHiddenFiles'],
					defaultPath,
				})[0];
				utils.debug(selectedPath);
				const selectedDir = fs.readdirSync(selectedPath);

				// check if selected folder contents include one of typical contents of data folder
				for (let i = 0; i <= selectedDir.length - 1; i += 1) {
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
					utils.debug(`isDataDir: ${isDataDir}`);
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
	utils.debug('Delete Mod');
};

// TODO: Bad code, refactor
const createDownloadListItem = (filename, fileid, filesize, modname, modversion) => {
	utils.debug(`dlist modversion: ${modversion}`);
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
		utils.debug(history.length);
		let index;
		const fileList = [];
		for (index = 0; index < history.length; index += 1) {
			// check if entry's file existing in mods directory and not a duplicate entry
			if (
				fs.existsSync(`${dir}/${appName}/mods/${history[index].filename}`) &&
				!fileList.includes(history[index].fileid)
			) {
				fileList.push(history[index].fileid);
				utils.debug(index);
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
				utils.debug(`Ignoring invalid history entry: ${history[index].fileid}`);
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
	document.getElementById('dropdownLabel').innerText =
		globalVariables.config.dropdownMenuItems.lastSelected.label;
	layoutApp.createDropdownItem(
		globalVariables.config.dropdownMenuItems.skse.id,
		globalVariables.config.dropdownMenuItems.skse.title
	);
	layoutApp.createDropdownItem('launchSkyrimSE', 'Launch Skyrim Special Edition');
};

// TODO?: seperate js file for init
const init = () => {
	getDownloadHistory();
	retrieveMods();
	globalVariables.config = configFunctions.getConfig();
	plugins.getPlugins();
	initDropdown();
};

ipcRenderer.on('request-download', async (event, obj) => {
	document.getElementById('collapseOne').classList.add('show');
	layoutApp.showClearHistory();
	if (fs.existsSync(join(`${dir}/${appName}/apikey`))) {
		const apiKey = fs.readFileSync(join(`${dir}/${appName}/apikey`));
		utils.debug(obj);
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
			utils.debug(JSON.parse(resp0.getBody().toString()));
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
				utils.debug(JSON.parse(resp1.getBody().toString()));
				const parsedFileInfo = JSON.parse(resp1.getBody().toString());
				filename = parsedFileInfo.file_name;
				fileid = parsedFileInfo.file_id;
				modversion = parsedFileInfo.mod_version;
				utils.debug(filename);
				request(
					'GET',
					`https://api.nexusmods.com/v1/games/${obj.game}/mods/${obj.modID}/files/${obj.fileID}/download_link.json?key=${obj.key}&expires=${obj.expires}`,
					{
						headers: { apikey: apiKey },
					}
				).done(resp2 => {
					utils.debug(JSON.parse(resp2.getBody().toString()));
					const parsedDownloadData = JSON.parse(resp2.getBody().toString());
					downloadURL = parsedDownloadData[0].URI;
					let roundedFilesizeInMB;

					utils.debug(downloadURL);
					if (!fs.existsSync(join(`${dir}/${appName}/mods`)))
						fs.mkdirSync(join(`${dir}/${appName}/mods`));
					// might switch to real wget or curl later
					const download = wget.download(
						downloadURL,
						join(`${dir}/${appName}/mods/${filename}`)
					);
					download.on('start', function(filesize) {
						roundedFilesizeInMB = Math.round((filesize / 1000000) * 10) / 10;
						utils.debug(`download start: m_version: ${modversion}`);
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
						utils.debug('DOWNLOAD ENDED');
						downloadHistory.push({
							modid,
							modname,
							modversion,
							fileid,
							filename,
							roundedFilesizeInMB,
						});
						utils.debug(downloadHistory);
						fs.writeFileSync(
							join(`${dir}/${appName}/downloadHistory.json`),
							JSON.stringify(downloadHistory, null, 4),
							err => {
								if (err) throw err;
								utils.debug('The file has been saved!');
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
