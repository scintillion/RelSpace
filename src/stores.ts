import { writable } from 'svelte/store';

export const menu = writable('closed');
export const selectedtile = writable({
	index: 0,
	width: 0,
	inner: '',
	height: 0,
	padding: 0,
	margin: 0,
	background: 'none',
	border: 'none',
	type: '0'
});
