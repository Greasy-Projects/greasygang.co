import { createDirectus, rest, readItem } from "@directus/sdk";
export { readItem };
export const client = createDirectus<Schema>("https://cms.greasygang.co").with(
	rest()
);

export const cms = client.request;

interface Schema {
	Sponsor: SponsorDetails[];
}

interface SponsorDetails {
	user_updated: string; // UUID of the user who updated
	date_updated: string; // ISO date string
	url: string; // URL of the sponsor page
	code: string; // Sponsor code
	description: string; // Sponsor description
	image: string; // UUID of the image
	enabled: boolean; // Status of the sponsor
	imagePosition: string;
}
