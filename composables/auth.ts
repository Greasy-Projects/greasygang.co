import type { GetMeQuery } from "#gql";

export const useUser = () => {
	const user = useAttrs().user as GetMeQuery | null;
	return user;
};
