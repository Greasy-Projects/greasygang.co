import { library, config } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faDollarSign, faDownload } from "@fortawesome/free-solid-svg-icons";
import {
	faDiscord,
	faTwitch,
	faYoutube,
	faTiktok,
	faTwitter,
	faSpotify,
} from "@fortawesome/free-brands-svg-icons";

config.autoAddCss = false;

library.add(
	faDownload,
	faDollarSign,
	faDiscord,
	faTwitch,
	faYoutube,
	faTiktok,
	faTwitter,
	faSpotify
);

export default defineNuxtPlugin(nuxtApp => {
	nuxtApp.vueApp.component("FontAwesomeIcon", FontAwesomeIcon);
});
