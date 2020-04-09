const fs = require('fs');
const { join } = require('path');

const appName = 'arcus';
const os = require('os');

const { homedir } = os;

let dir;

if (process.platform === 'darwin') {
	dir = join(`${homedir}/Library/Application Support`);
} else if (process.platform === 'linux') {
	dir = join(`${homedir}/.local/share`);
}
// const { fs, join, dir, appName } = window;

const protonMap = fs.readFileSync(join(`${dir}/${appName}/protonMap.json`), 'utf8');

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

exports.protonMap = protonMap;
exports.parseProton = parseProton;
