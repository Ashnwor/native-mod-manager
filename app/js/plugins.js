const fs = require('fs');
const { join, extname } = require('path');
const { debug } = require('./utils');
const layoutApp = require('./layoutApp');
const globalVariables = require('./globalVariables');

const createPluginItemIfPlugin = line => {
	if (line[0] === '#') debug(`${line} COMMENT`);
	if (line[0] !== '*' && extname(line) === '.esp') {
		debug(`${line} PLUGIN, NOT ACTIVE`);
		layoutApp.createPluginsItem(line, false);
	}
	if (line[0] === '*' && extname(line) === '.esp') {
		debug(`${line} PLUGIN, ACTIVE`);
		layoutApp.createPluginsItem(line, true);
	}
};

const getPlugins = () => {
	const rightMenu = document.getElementById('rightMenuList');
	rightMenu.innerHTML = '';
	// Get this from preload in relation to selected game
	const skyrimSEid = 489830;
	const pfx = join(`${globalVariables.config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`);
	const pluginsDir = join(
		`${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`
	);

	globalVariables.lines = [];
	debug(pluginsDir);
	const pluginsFile = fs.readFileSync(join(`${pluginsDir}/Plugins.txt`), 'utf8');

	pluginsFile.split(/\r?\n/).forEach(line => {
		globalVariables.lines.push(line);
	});
	globalVariables.lines = globalVariables.lines.filter(value => value !== '');
	debug(globalVariables.lines);
	for (let i = 0; i < globalVariables.lines.length; i += 1) {
		createPluginItemIfPlugin(globalVariables.lines[i]);
	}
};

const writePlugins = arr => {
	const skyrimSEid = 489830;
	const pfx = join(`${globalVariables.config.skyrimSE}/../../compatdata/${skyrimSEid}/pfx`);
	const pluginsDir = join(
		`${pfx}/drive_c/users/steamuser/Local Settings/Application Data/Skyrim Special Edition`
	);
	debug(pluginsDir);
	const pluginsFile = join(`${pluginsDir}/Plugins.txt`);

	fs.writeFileSync(pluginsFile, arr.join('\n'), err => {
		debug(err ? `Error :${err}` : 'ok');
	});
	getPlugins();
};

const addPlugin = espArr => {
	getPlugins();
	espArr.forEach(value => {
		if (!globalVariables.lines.includes(value) && !globalVariables.lines.includes(`*${value}`)) {
			globalVariables.lines.push(value);
		}
	});
	debug(globalVariables.lines);
};

exports.createPluginItemIfPlugin = createPluginItemIfPlugin;
exports.getPlugins = getPlugins;
exports.writePlugins = writePlugins;
exports.addPlugin = addPlugin;
