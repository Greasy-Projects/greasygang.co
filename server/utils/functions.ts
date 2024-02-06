export function getObjectDifferences(
	oldObject: { [x: string]: any },
	newObject: { [x: string]: any }
) {
	if (Object.keys(oldObject).length == 0 && Object.keys(newObject).length > 0)
		return newObject;

	const diff: { [x: string]: any } = {};
	for (const key in oldObject) {
		if (newObject[key] && oldObject[key] != newObject[key]) {
			diff[key] = newObject[key];
		}
	}

	if (Object.keys(diff).length > 0) return diff;

	return oldObject;
}
