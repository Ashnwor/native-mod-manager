// Preferences

const createBottomNav = done => {
	const bottomNav = document.createElement('nav');
	bottomNav.id = 'bottomNav';
	bottomNav.classList.add(
		'navbar',
		'navbar-expand-sm',
		'bg-dark',
		'navbar-dark',
		'fixed-bottom',
		'prefs-bottom-navbar'
	);
	if (done) {
		const doneButtonA = document.createElement('a');
		doneButtonA.classList.add('navbar-nav', 'ml-auto');
		const doneButton = document.createElement('button');
		doneButton.id = 'done';
		doneButton.type = 'button';
		doneButton.classList.add('btn', 'btn-primary');
		doneButton.innerText = 'Done';
		doneButtonA.appendChild(doneButton);
		bottomNav.appendChild(doneButtonA);
	}
	document.body.appendChild(bottomNav);
};

const cleanRightList = () => {
	const rightList = document.getElementById('rightMenuList');
	rightList.innerHTML = '';
};

const removeBottomNav = () => {
	const bottomNav = document.getElementById('bottomNav');
	if (bottomNav) document.body.removeChild(bottomNav);
};

const createInput = (id, text, placeholder) => {
	const rightList = document.getElementById('rightMenuList');
	const outerDiv = document.createElement('div');
	outerDiv.classList.add('input-group', 'mb-3');
	outerDiv.style = 'margin-bottom: 0px!important;';
	const innerDiv = document.createElement('div');
	innerDiv.classList.add('input-group-prepend');
	const label = document.createElement('span');
	label.classList.add('input-group-text');
	label.innerText = text;
	const textInput = document.createElement('input');
	textInput.id = id;
	textInput.type = 'text';
	textInput.classList.add('form-control');
	textInput.placeholder = placeholder;
	innerDiv.appendChild(label);
	outerDiv.appendChild(innerDiv);
	outerDiv.appendChild(textInput);
	const listItem = document.createElement('li');
	listItem.classList.add('list-group-item');
	listItem.appendChild(outerDiv);
	rightList.appendChild(listItem);
};

const createSelect = (id, lbl, obj, defaultValue) => {
	const outerDiv = document.createElement('div');
	outerDiv.classList.add('input-group', 'mb-3');
	outerDiv.style = 'margin-bottom: 0px!important;';
	const innerDiv = document.createElement('div');
	innerDiv.classList.add('input-group-prepend');
	const label = document.createElement('label');
	label.classList.add('input-group-text');
	label.htmlFor = id;
	label.innerText = lbl;
	const selection = document.createElement('select');
	selection.classList.add('custom-select');
	selection.id = id;

	for (let i = 0; i <= obj.length - 1; i += 1) {
		const option = document.createElement('option');
		option.value = obj[i].label;
		option.dataset.location = obj[i].prefix;
		option.innerText = `${obj[i].prefix}: ${obj[i].label}`;
		if (defaultValue.text === obj[i].label && defaultValue.location === obj[i].prefix) {
			option.selected = true;
		}
		selection.appendChild(option);
	}

	innerDiv.appendChild(label);
	outerDiv.appendChild(innerDiv);
	outerDiv.appendChild(selection);
	const rightList = document.getElementById('rightMenuList');
	const listItem = document.createElement('li');
	listItem.classList.add('list-group-item');
	listItem.appendChild(outerDiv);
	rightList.appendChild(listItem);
};

const createAllText = text => {
	const listItem = document.createElement('li');
	listItem.classList.add('list-group-item');
	listItem.style = 'overflow-y: scroll; margin-bottom: 6vh;';
	listItem.innerText = text;
	const rightList = document.getElementById('rightMenuList');
	rightList.classList.add('h-100');
	rightList.appendChild(listItem);
};

exports.createBottomNav = createBottomNav;
exports.cleanRightList = cleanRightList;
exports.removeBottomNav = removeBottomNav;
exports.createInput = createInput;
exports.createSelect = createSelect;
exports.createAllText = createAllText;
