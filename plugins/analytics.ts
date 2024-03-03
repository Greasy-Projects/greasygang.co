export default defineNuxtPlugin(() => {
	addRouteMiddleware(
		"clarity",
		() => {
			if (process.client) {
				const script = document.createElement("script");
				script.type = "text/javascript";
				script.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "lamwpyz0kn");`;
				document.head.appendChild(script);
			}
		},
		{ global: true }
	);
	addRouteMiddleware(
		"google",
		() => {
			if (process.client) {
				const gtag = document.createElement("script");
				gtag.async = true;
				gtag.src = "https://www.googletagmanager.com/gtag/js?id=G-PVTY71FRX0";
				document.head.appendChild(gtag);
				const push = document.createElement("script");
				push.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-PVTY71FRX0');`;
				document.head.appendChild(push);
			}
		},
		{ global: true }
	);
});
