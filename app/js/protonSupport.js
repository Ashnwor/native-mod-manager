const fs = require('fs');
const { join } = require('path');
const { homedir } = require('os');
const { dialog } = require('electron').remote;
const { execSync } = require('child_process');

const globalVariables = require('./globalVariables');
const configFunctions = require('./configFunctions');

let config;
// const { fs, join, dir, appName } = window;

const protonMap = () => {
	if (fs.existsSync(join(`${globalVariables.appDataDir()}/${globalVariables.appName}/protonMap.json`)))
		return fs.readFileSync(
			join(`${globalVariables.appDataDir()}/${globalVariables.appName}/protonMap.json`),
			'utf8'
		);
};

const parseProton = obj => {
	const arr = [];
	// debug(obj.common);
	for (let i = 0; i <= Object.keys(obj.common).length - 1; i += 1) {
		// debug(obj.common[i].name);
		arr.push({ prefix: 'common', label: obj.common[i].name });
	}
	if (obj.compatibilitytools) {
		for (let i = 0; i <= Object.keys(obj.compatibilitytools).length - 1; i += 1) {
			// debug(obj.compatibilitytools[i].name);
			arr.push({
				prefix: 'compatibilitytools',
				label: obj.compatibilitytools[i].name,
			});
		}
	}

	return arr;
};

const genRunScript = isForSKSE => {
	config = configFunctions.getConfig();
	let runnerPath;
	if (config.protonVersion.location === 'common') {
		runnerPath = join(`${homedir}/.steam/steam/steamapps/common/${config.protonVersion.version}`);
	} else if (config.protonVersion.location === 'compatibilitytools') {
		runnerPath = join(`${homedir}/.steam/steam/compatibilitytools.d/${config.protonVersion.version}`);
	} else if (config.protonVersion.location === 'null') {
		dialog.showErrorBox(
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
	if (isForSKSE) {
		// for true: generate for skse64
		runArr[4] = `DEF_CMD=("${config.skyrimSE}/skse64_loader.exe")`;
	} else {
		// for false: generate for skyrim
		runArr[4] = `DEF_CMD=("${config.skyrimSE}/SkyrimSE.exe")`;
	}
	runArr[5] = `PATH="${runnerPath}/dist/bin/:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/amd64/bin:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/amd64/usr/bin:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/usr/bin:/usr/local/bin:/usr/local/sbin:/usr/bin" \\`;
	runArr[6] = `TERM="xterm" \\`;
	runArr[7] = `WINEDEBUG="-all" \\`;
	runArr[8] = `        LD_PRELOAD="/usr/$LIB/libgamemodeauto.so.0::${homedir}/.steam/steam/ubuntu12_32/gameoverlayrenderer.so:${homedir}/.steam/steam/ubuntu12_64/gameoverlayrenderer.so" \\`;
	runArr[9] = `        WINEDLLPATH="${runnerPath}/dist/lib64//wine:${runnerPath}/dist/lib//wine" \\`;
	runArr[10] = `        LD_LIBRARY_PATH="${runnerPath}/dist/lib64/:${runnerPath}/dist/lib/:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/pinned_libs_32:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/pinned_libs_64:/usr/lib/libfakeroot:/usr/lib32:/usr/lib/openmpi:/usr/lib:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/lib/i386-linux-gnu:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/usr/lib/i386-linux-gnu:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/lib/x86_64-linux-gnu:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/usr/lib/x86_64-linux-gnu:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/lib:${homedir}/.steam/steam/ubuntu12_32/steam-runtime/usr/lib:" \\`;
	runArr[11] = `	      WINEPREFIX="${homedir}/.steam/steam/steamapps/compatdata/489830/pfx/" \\`;
	runArr[12] = `	      WINEESYNC="1" \\`;
	runArr[13] = `        SteamGameId="489830" \\`;
	runArr[14] = `	      SteamAppId="489830" \\`;
	runArr[15] = `	      WINEDLLOVERRIDES="xaudio2_7=n,b;steam.exe=b;mfplay=n;dxvk_config=n;d3d11=n;d3d10=n;d3d10core=n;d3d10_1=n" \\`;
	runArr[16] = `        STEAM_COMPAT_CLIENT_INSTALL_PATH="${homedir}/.steam/steam" \\`;
	runArr[17] = `	      "${runnerPath}/dist/bin/wine" steam.exe "\${@:-\${DEF_CMD[@]}}"`;
	// debug(runArr);
	// debug(runArr[17]);
	if (isForSKSE) {
		fs.writeFileSync('runSKSE', runArr.join('\n'), function(err) {
			// debug(err ? `Error :${err}` : 'ok');
		});
		execSync('chmod +x runSKSE');
	} else {
		fs.writeFileSync('runSkyrim', runArr.join('\n'), function(err) {
			// debug(err ? `Error :${err}` : 'ok');
		});
		execSync('chmod +x runSkyrim');
	}
};

const genProtonMap = () => {
	let id = -1;
	const protonMapObj = {};
	protonMapObj.common = {};
	if (process.platform === 'linux') {
		const steamAppsCommon = join(`${homedir}/.steam/steam/steamapps/common`);
		fs.readdirSync(steamAppsCommon).forEach(file => {
			// debug(file);
			if (file.includes('Proton')) {
				if (fs.existsSync(join(`${homedir}/.steam/steam/steamapps/common/${file}/proton`))) {
					protonMapObj.common[id + 1] = { name: file };
					id += 1;
				}
			}
		});
		const compatibilitytools = join(`${homedir}/.steam/steam/compatibilitytools.d`);
		if (fs.existsSync(compatibilitytools)) {
			protonMapObj.compatibilitytools = {};
			id = -1;
			fs.readdirSync(compatibilitytools).forEach(file => {
				// debug(file);
				if (file.includes('Proton')) {
					if (
						fs.existsSync(
							join(
								`${homedir}/.steam/steam/compatibilitytools.d/${file}/proton`
							)
						)
					) {
						protonMapObj.compatibilitytools[id + 1] = { name: file };
						id += 1;
					}
				}
			});
		}
		fs.writeFileSync(
			join(`${globalVariables.appDataDir()}/${globalVariables.appName}/protonMap.json`),
			JSON.stringify(protonMapObj, null, 4),
			err => {
				if (err) throw err;
				// debug('The file has been saved!');
			}
		);
		// const map = fs.readFileSync(join(`${globalVariables.appDataDir()}/${globalVariables.appName}/protonMap.json`),'utf8');
		// debug(JSON.parse(map));
	}
};

exports.protonMap = protonMap;
exports.parseProton = parseProton;
exports.genProtonMap = genProtonMap;
exports.genRunScript = genRunScript;
