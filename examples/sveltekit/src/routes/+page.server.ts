export async function load({ locals }) {
	return {
		csrfToken: locals.csrfToken,
	};
}
