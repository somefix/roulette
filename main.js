import './style.css'

const body = document.querySelector('body');
const canvas = document.querySelector('canvas');
const button = document.querySelector('button');
const context = canvas.getContext('2d');

const CLIENT_WIDTH = body.clientWidth;
const IMAGE_GAP = 8;
const IMAGE_WIDTH = 151;
const IMAGE_HEIGHT = 151;
const IMAGE_COUNT = Math.ceil(CLIENT_WIDTH/IMAGE_WIDTH);
const IMAGES_PADDING = 22;
const CENTER_DELAY = ((IMAGE_COUNT * (IMAGE_WIDTH + IMAGE_GAP) - IMAGE_GAP) - CLIENT_WIDTH)/2
const OFFSET = 1;
const BASE_SPEED = 5;
const ACCELERATION_DURATION_MIN = 500;
const ACCELERATION_DURATION_MAX = 1500;
const ACCELERATION_STEP = 1;
const DECELERATION_MULTIPLIER = 0.95;
const RETURN_MULTIPLIER = 0.1;
const STATE = {
	ACCELERATION: 1,
	DECELERATION: 2,
	RETURN: 3
};

const images = [];
const imageUrls = [
	'./public/Rectangle1.png',
	'./public/Rectangle2.png',
	'./public/Rectangle3.png',
	'./public/Rectangle4.png',
	'./public/Rectangle5.png',
];
let speed = 0;
let state = STATE.RETURN;
let startIndex = 0;
let startTime = 0;
let accelerationDuration = 0;
let offset = 0;

const loadImage = (url) => fetch(url)
	.then(response => response.blob())
	.then(createImageBitmap);

const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const draw = () => {
	const imagesLength = images.length;

	context.fillStyle = 'rgba(9, 84, 21, 0.3)';
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillRect(0, 0, canvas.width, canvas.height);

	for (let index = -OFFSET; index < IMAGE_COUNT + OFFSET; index++) {
		const imageIndex = index < 0 ? index + imagesLength : index;
		const image = images[(imageIndex + startIndex) % imagesLength];

		context.drawImage(
			image,
			(IMAGE_WIDTH + IMAGE_GAP) * index - CENTER_DELAY - offset,
			IMAGES_PADDING,
			IMAGE_WIDTH,
			IMAGE_HEIGHT
		);
	}

	drawSeparator();
};

function drawSeparator() {
	const center = Math.floor(canvas.width / 2)

	context.beginPath();
	context.moveTo(center - 2, 0);
	context.lineTo(center - 2, canvas.height);
	context.closePath();
	context.strokeStyle = 'white';
	context.lineWidth = 4;
	context.stroke();
}

const update = () => {
	const imagesLength = images.length;
	const deltaTime = performance.now() - startTime;

	if (deltaTime > accelerationDuration && state === STATE.ACCELERATION) {
		state = STATE.DECELERATION;
	}

	if (offset > IMAGE_WIDTH) {
		startIndex = (startIndex + 1) % imagesLength;
		offset %= IMAGE_WIDTH;
	}

	draw();

	const center = IMAGE_WIDTH * IMAGE_COUNT / 2;
	const index = Math.floor((center + offset) / IMAGE_WIDTH);

	offset += speed;
	if (state === STATE.ACCELERATION) {
		speed += ACCELERATION_STEP;
	} else if (state === STATE.DECELERATION) {
		speed *= DECELERATION_MULTIPLIER;
		if (speed < 1e-2) {
			speed = 0;
			state = STATE.RETURN;
		}
	} else if (state === STATE.RETURN) {
		const halfCount = Math.floor(IMAGE_COUNT / 2);
		const distance = IMAGE_WIDTH * (index - halfCount) - offset;
		const step = distance * RETURN_MULTIPLIER;

		offset += Math.max(0.1, Math.abs(step)) * Math.sign(step);

		if (Math.abs(offset) <= 0.1) {
			offset = 0;
		}
	}

	if (speed > 0 || offset !== 0) {
		requestAnimationFrame(update);
	} else {
		const winner = (index + startIndex) % imagesLength;

		drawRoundedRect((IMAGE_WIDTH + IMAGE_GAP) * index - CENTER_DELAY - offset, IMAGES_PADDING, IMAGE_WIDTH, IMAGE_HEIGHT, 20, 'rgba(255, 0, 255, 0.2)');
		drawSeparator();
		console.group('Winner');
		console.log('Index', winner);
		console.log('Image', imageUrls[winner]);
		console.groupEnd();
	}
};

function drawRoundedRect(x, y, width, height, radius, fillStyle) {
	context.beginPath();
	context.moveTo(x + radius, y);
	context.lineTo(x + width - radius, y);
	context.arcTo(x + width, y, x + width, y + height, radius);
	context.lineTo(x + width, y + height - radius);
	context.arcTo(x + width, y + height, x, y + height, radius);
	context.lineTo(x + radius, y + height);
	context.arcTo(x, y + height, x, y, radius);
	context.lineTo(x, y + radius);
	context.arcTo(x, y, x + radius, y, radius);
	context.closePath();
	context.fillStyle = fillStyle; // Цвет заливки
	context.fill(); // Заполнение фигуры
}

const init = async () => {
	[canvas.width, canvas.height] = [CLIENT_WIDTH, IMAGE_HEIGHT + IMAGES_PADDING * 2];

	console.group('Loading images');
	for (const imageUrl of imageUrls) {
		console.group(imageUrl);
		console.time('loading');
		images.push(await loadImage(imageUrl));
		console.timeEnd('loading');
		console.groupEnd();
	}
	console.log(images);
	console.groupEnd();

	button.addEventListener('click', event => {
		event.preventDefault();

		if (speed === 0 && offset === 0) {
			startTime = performance.now();
			accelerationDuration = random(ACCELERATION_DURATION_MIN, ACCELERATION_DURATION_MAX);
			state = STATE.ACCELERATION;
			speed = BASE_SPEED;

			requestAnimationFrame(update);
		}
	});

	draw();
};

window.addEventListener('DOMContentLoaded', init);

