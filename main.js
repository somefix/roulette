import './style.css'

const body = document.querySelector('body');
const canvas = document.querySelector('canvas');
const button = document.querySelector('button');
const context = canvas.getContext('2d');

const CLIENT_WIDTH = body.clientWidth;
const IMAGE_WIDTH = 151;
const IMAGE_HEIGHT = 151;
const IMAGE_COUNT = Math.ceil(CLIENT_WIDTH/IMAGE_WIDTH);
const IMAGES_PADDING = 22;
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
	'./public/Rectangle 94.png',
	'./public/Rectangle 94.png',
	'./public/Rectangle 94.png',
	'./public/Rectangle 94.png',
	'./public/Rectangle 94.png',
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
	const center = Math.floor(canvas.width / 2)

	context.fillStyle = '#0954154D';
	context.fillRect(0, 0, canvas.width, canvas.height);

	for (let index = -OFFSET; index < IMAGE_COUNT + OFFSET; index++) {
		const imageIndex = index < 0 ? index + imagesLength : index;
		const image = images[(imageIndex + startIndex) % imagesLength];
		context.drawImage(
			image,
			IMAGE_WIDTH * index - offset,
			0,
			IMAGE_WIDTH,
			IMAGE_HEIGHT
		);
	}

	context.moveTo(center + 0.5, 0);
	context.lineTo(center + 0.5, canvas.height);
	context.closePath();
	context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
	context.stroke();
};

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

		context.fillStyle = 'rgba(255, 0, 255, 0.2)';
		context.fillRect(index * IMAGE_WIDTH - offset, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
		console.group('Winner');
		console.log('Index', winner);
		console.log('Image', imageUrls[winner]);
		console.groupEnd();
	}
};

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

