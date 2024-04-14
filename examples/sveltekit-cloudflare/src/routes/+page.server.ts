export async function load({ locals }) {
	return {
		csrfToken: locals.csrfToken,
	};
}

export const actions = {
	default: async () => {
		return { success: true };
	},
};
