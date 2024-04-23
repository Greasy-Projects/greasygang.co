import { z } from "zod";

export default z.object({
	enabled: z.boolean().describe("; Whether  to show the sponsor or not"),
	imageCoverMode: z
		.enum(["left", "center", "right"])
		.describe("; left | center | right"),
	image: z.string().min(5).describe("banner"),
	code: z.string().describe("to show in the code label"),
	description: z.string().min(50).describe("shown underneath the image"),
	url: z.string().min(5).describe("that the button leads to"),
});
