const debug = debugThis => window.globalDebug(debugThis);
const { platform, ipcRenderer, appName, fs, os, join } = window;
const { layoutPreferences, protonSupport } = window;
const { homedir } = os;
let dir;
let rawConfig;
let config;

if (platform === 'darwin') {
	dir = join(`${homedir}/Library/Application Support`);
} else if (platform === 'linux') {
	dir = join(`${homedir}/.local/share`);
}

const getConfig = () => {
	rawConfig = fs.readFileSync(join(`${dir}/${appName}/config.json`));
	config = JSON.parse(rawConfig);
};

const writeConfig = () => {
	fs.writeFileSync(join(`${dir}/${appName}/config.json`), JSON.stringify(config, null, 4), err => {
		if (err) throw err;
		debug('The file has been saved!');
	});
	getConfig();
};

debug(JSON.parse(protonSupport.protonMap));

debug(protonSupport.parseProton(JSON.parse(protonSupport.protonMap)));

const protonMenu = () => {
	layoutPreferences.cleanRightList();
	layoutPreferences.removeBottomNav();
	// Version Select
	getConfig();
	layoutPreferences.createSelect(
		'protonVersions',
		'Version',
		protonSupport.parseProton(JSON.parse(protonSupport.protonMap)),
		{
			location: config.protonVersion.location,
			text: config.protonVersion.version,
		}
	);
	layoutPreferences.createBottomNav();
	document.getElementById('done').addEventListener('click', () => {
		getConfig();
		const protonVersions = document.getElementById('protonVersions');
		debug(protonVersions.options[protonVersions.selectedIndex].value);
		config.protonVersion = {
			version: protonVersions.options[protonVersions.selectedIndex].value,
			location: protonVersions.options[protonVersions.selectedIndex].dataset.location,
		};
		debug(config);
		writeConfig();
		ipcRenderer.send('gen-run-script');
	});
};

const apiKeyMenu = () => {
	layoutPreferences.cleanRightList();
	layoutPreferences.removeBottomNav();
	layoutPreferences.createInput('apikey', 'Api Key', 'Api Key');
	if (fs.existsSync(join(`${dir}/${appName}/apikey`))) {
		document.getElementById('apikey').value = fs.readFileSync(join(`${dir}/${appName}/apikey`), 'utf8');
	}
	layoutPreferences.createBottomNav();
	document.getElementById('done').addEventListener('click', () => {
		debug(document.getElementById('apikey').value);
		fs.writeFileSync(join(`${dir}/${appName}/apikey`), document.getElementById('apikey').value, err => {
			if (err) throw err;
			debug('The file has been saved!');
		});
	});
};

// Menu event listeners
document.getElementById('protonMenu').addEventListener('click', () => protonMenu());

document.getElementById('apiKeyMenu').addEventListener('click', () => apiKeyMenu());
// First item on menu
protonMenu();
