if (window.platform === 'linux') {
	const dir = `/home/${window.getUsername}/.local/share`;
	window.con.log(window.fs.readdirSync(dir));
	if (!window.fs.existsSync(`${dir}/${window.appName}`)) {
		window.con.log('First time setup');
		window.fs.mkdirSync(`${dir}/${window.appName}`);
		window.ipcRenderer.send('open-game-select');
	}
}
