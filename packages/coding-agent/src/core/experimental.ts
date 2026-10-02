export function areExperimentalFeaturesEnabled(): boolean {
	return process.env.GIHANGA_EXPERIMENTAL === "1" || process.env.PI_EXPERIMENTAL === "1";
}
