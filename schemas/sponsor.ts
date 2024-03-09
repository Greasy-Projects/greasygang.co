import { z } from "zod";

export default z.object({
	enabled: z.boolean().describe("; Whether  to show the sponsor or not"),
	code: z.string().describe("to show in the code label"),
	description: z.string().min(100).describe("shown underneath the image"),
	image: z.string().min(5).describe("banner"),
	url: z.string().min(5).describe("that the button leads to"),
});
