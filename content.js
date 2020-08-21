import SweetAlert from 'sweetalert2';
import download from 'downloadjs';
import format from 'date-fns/format';
import MicRecorder from 'mic-recorder-to-mp3';

const addStyles = () => {
	const style = document.createElement('style');
	style.innerHTML = `
		@keyframes slack-voice-popup-show-keyframes {
			0% {
				transform: translateY(8px) scale(0.96);
				opacity: 0;
			}

			100% {
				transform: translateY(0) scale(1);
				opacity: 1;
			}
		}

		@keyframes slack-voice-popup-hide-keyframes {
			0% {
				transform: translateY(0) scale(1);
				opacity: 1;
			}

			100% {
				transform: translateY(8px) scale(0.96);
				opacity: 0;
			}
		}

		@keyframes slack-voice-pulse-keyframes {
			0% {
				opacity: 1;
			}

			50% {
				opacity: 0.5;
			}

			100% {
				opacity: 1;
			}
		}

		.slack-voice-popup-show {
			animation: slack-voice-popup-show-keyframes 200ms cubic-bezier(0.645, 0.045, 0.355, 1);
		}

		.slack-voice-popup-hide {
			animation: slack-voice-popup-hide-keyframes 200ms cubic-bezier(0.645, 0.045, 0.355, 1);
		}

		.slack-voice-pulse {
			animation: slack-voice-pulse-keyframes 1.4s linear alternate infinite;
		}
	`;

	document.head.append(style);
};

const showRecordingAlert = () => {
	return SweetAlert.fire({
		title: 'Recording...',
		text: 'When you\'re done, click "Send" or press Enter.',
		allowEscapeKey: false,
		allowOutsideClick: false,
		cancelButtonText: 'Cancel',
		cancelButtonColor: '#dfdfdf',
		confirmButtonText: 'Send',
		confirmButtonColor: '#1364a3',
		imageUrl:
			'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlNTNlM2UiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLW1pYyI+PHBhdGggZD0iTTEyIDFhMyAzIDAgMCAwLTMgM3Y4YTMgMyAwIDAgMCA2IDBWNGEzIDMgMCAwIDAtMy0zeiI+PC9wYXRoPjxwYXRoIGQ9Ik0xOSAxMHYyYTcgNyAwIDAgMS0xNCAwdi0yIj48L3BhdGg+PGxpbmUgeDE9IjEyIiB5MT0iMTkiIHgyPSIxMiIgeTI9IjIzIj48L2xpbmU+PGxpbmUgeDE9IjgiIHkxPSIyMyIgeDI9IjE2IiB5Mj0iMjMiPjwvbGluZT48L3N2Zz4=',
		imageWidth: 64,
		imageHeight: 64,
		reverseButtons: true,
		showCancelButton: true,
		showClass: {
			popup: 'slack-voice-popup-show'
		},
		hideClass: {
			popup: 'slack-voice-popup-hide'
		},
		customClass: {
			image: 'slack-voice-pulse'
		}
	});
};

const showSuccessAlert = () => {
	return SweetAlert.fire({
		title: 'Upload your recording',
		text: 'Drag & drop the downloaded recording into a file dialog.',
		icon: 'success',
		timer: 5000,
		position: 'bottom',
		showConfirmButton: false,
		showClass: {
			popup: 'slack-voice-popup-show'
		},
		hideClass: {
			popup: 'slack-voice-popup-hide'
		}
	});
};

const record = async stream => {
	try {
		const recorder = new MicRecorder({
			bitRate: 128
		});

		await recorder.start();

		const result = await showRecordingAlert();
		recorder.stop();

		if (result.isDismissed) {
			return;
		}

		const [buffer, blob] = await recorder.getMp3();
		const timestamp = format(new Date(), "yyyy-MM-dd 'at' HH.mm.ss");
		const name = `Voice Recording ${timestamp}.mp3`;

		download(blob, name, 'audio/mp3');
		showSuccessAlert();

		const input = document.querySelector('input[type="file"]');

		if (input) {
			input.click();
		}
	} catch (error) {
		console.error(error);
	}
};

const run = () => {
	addStyles();

	const buttons = document.querySelector('.ql-buttons');

	if (!buttons) {
		return;
	}

	const hasFormattingButton = buttons.querySelectorAll('button').length === 5;

	const button = document.createElement('button');
	button.className =
		'c-button-unstyled c-icon_button c-icon_button--light c-icon_button--size_medium c-texty_input__button';
	button.type = 'button';
	button.style.position = 'absolute';
	button.style.right = hasFormattingButton ? '166px' : '134px';
	button.innerHTML =
		'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-mic"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';

	button.addEventListener('click', async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: false
			});

			button.disabled = 'true';
			await record(stream);
			button.disabled = undefined;
		} catch (error) {
			console.error(error);
		}
	});

	buttons.append(button);
};

window.addEventListener('load', () => {
	// Slack inserts formatting button async after load, so we'll need to wait for that
	setTimeout(run, 1000);
});
