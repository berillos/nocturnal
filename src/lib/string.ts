export function truncateWithin({
	text,
	startLength = 8,
	endLength = 8
}: {
	text: string;
	startLength?: number;
	endLength?: number;
}) {
	if (!text) return '';
	const start = text.slice(0, startLength);
	const end = text.slice(-endLength);
	return `${start}...${end}`;
}
