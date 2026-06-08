<template>
	<div class="diner-fallback">
		<div class="fallback-scene" aria-hidden="true">
			<div class="fallback-wall">
				<div class="fallback-neon">GREASY GANG</div>
				<div class="fallback-board fallback-board-left">
					<span>MENU</span>
					<small>discord · twitch · youtube</small>
				</div>
				<div class="fallback-board fallback-board-right">
					<span>TODAY</span>
					<small>hot · loud · extra</small>
				</div>
				<div class="fallback-lamp fallback-lamp-a" />
				<div class="fallback-lamp fallback-lamp-b" />
				<div class="fallback-lamp fallback-lamp-c" />
			</div>
			<div class="fallback-counter" />
			<div class="fallback-floor" />
		</div>
		<div class="fallback-copy font-bebas">
			<p>EST. 2019 · OPEN LATE · EXTRA GREASY</p>
			<h1>GREASYGANG</h1>
			<span>loading the diner</span>
			<div class="fallback-bar"><i /></div>
		</div>
	</div>
</template>

<style scoped>
.diner-fallback {
	position: fixed;
	inset: 0;
	z-index: 10;
	display: grid;
	place-items: center;
	overflow: hidden;
	background:
		radial-gradient(
			circle at 50% 42%,
			rgba(250, 64, 64, 0.18),
			transparent 32%
		),
		linear-gradient(180deg, #030101 0%, #100402 56%, #050202 100%);
	color: #fff2c8;
}

.fallback-scene {
	position: absolute;
	inset: 0;
	perspective: 680px;
	overflow: hidden;
}

.fallback-wall {
	position: absolute;
	left: 50%;
	top: 13%;
	width: min(48rem, 74vw);
	height: min(21rem, 42vh);
	transform: translateX(-50%) rotateX(7deg);
	transform-origin: 50% 100%;
	background:
		linear-gradient(
			90deg,
			transparent 0 18%,
			rgba(0, 0, 0, 0.28) 18% 19%,
			transparent 19% 81%,
			rgba(0, 0, 0, 0.28) 81% 82%,
			transparent 82%
		),
		repeating-linear-gradient(
			0deg,
			rgba(255, 242, 200, 0.045) 0 2px,
			transparent 2px 7px
		),
		linear-gradient(180deg, #9e1510 0 46%, #1b0906 46% 48%, #e1ad67 48% 100%);
	box-shadow: 0 0 5rem rgba(232, 169, 70, 0.18);
}

.fallback-neon {
	position: absolute;
	left: 50%;
	top: 16%;
	width: min(22rem, 48vw);
	padding: 0.55rem 1rem;
	transform: translateX(-50%);
	border: 0.28rem solid #170806;
	background: #080302;
	color: #fff6c8;
	font-family: Impact, "Arial Black", sans-serif;
	font-size: clamp(1.8rem, 5vw, 4rem);
	line-height: 1;
	text-align: center;
	text-shadow:
		0 0 0.4rem #fff2c8,
		0 0 1.1rem #f6cf5d,
		0 0 2rem #e8a946;
	animation: fallbackNeon 1.45s ease-in-out infinite;
}

.fallback-board {
	position: absolute;
	bottom: 17%;
	width: 7.8rem;
	height: 5rem;
	border: 0.22rem solid #1b0804;
	background: #0b0302;
	color: #e8a946;
	display: grid;
	place-items: center;
	text-align: center;
	box-shadow: 0 0 1.2rem rgba(0, 0, 0, 0.5);
}

.fallback-board-left {
	left: 23%;
}

.fallback-board-right {
	right: 23%;
}

.fallback-board span {
	font-family: Impact, "Arial Black", sans-serif;
	font-size: 1.2rem;
}

.fallback-board small {
	max-width: 6.5rem;
	color: rgba(255, 242, 200, 0.56);
	font-size: 0.58rem;
	text-transform: uppercase;
}

.fallback-lamp {
	position: absolute;
	top: 3%;
	width: 3.4rem;
	height: 2rem;
	border-radius: 50%;
	background:
		radial-gradient(ellipse at 50% 70%, #fff2c8 0 22%, transparent 23%),
		radial-gradient(
			ellipse at 50% 45%,
			#080403 0 56%,
			#e8a946 57% 62%,
			transparent 63%
		);
	filter: drop-shadow(0 0 1.1rem rgba(232, 169, 70, 0.6));
}

.fallback-lamp::before {
	content: "";
	position: absolute;
	left: 50%;
	bottom: 72%;
	width: 1px;
	height: 8rem;
	background: rgba(232, 169, 70, 0.28);
}

.fallback-lamp-a {
	left: 28%;
}

.fallback-lamp-b {
	left: 50%;
	transform: translateX(-50%);
}

.fallback-lamp-c {
	right: 28%;
}

.fallback-counter {
	position: absolute;
	left: 50%;
	top: 57%;
	width: min(37rem, 64vw);
	height: 4.2rem;
	transform: translateX(-50%) rotateX(12deg);
	background: linear-gradient(180deg, #210806 0 18%, #080302 18% 100%);
	box-shadow:
		0 -0.3rem 0 #e8a946,
		0 1.8rem 3rem rgba(0, 0, 0, 0.65);
}

.fallback-floor {
	position: absolute;
	left: -10%;
	right: -10%;
	bottom: -22%;
	height: 52%;
	transform: rotateX(64deg);
	transform-origin: 50% 100%;
	background:
		linear-gradient(rgba(232, 169, 70, 0.08), rgba(0, 0, 0, 0.6)),
		repeating-linear-gradient(90deg, #070302 0 3rem, #b47b37 3rem 6rem),
		repeating-linear-gradient(
			0deg,
			transparent 0 3rem,
			rgba(0, 0, 0, 0.7) 3rem 6rem
		);
	background-blend-mode: normal, difference, normal;
	animation: fallbackFloor 1.8s linear infinite;
}

.fallback-copy {
	position: relative;
	z-index: 2;
	margin-top: 8vh;
	text-align: center;
	text-transform: uppercase;
	text-shadow: 0 0.28rem 0 rgba(0, 0, 0, 0.45);
}

.fallback-copy p,
.fallback-copy span {
	margin: 0;
	color: rgba(255, 242, 200, 0.82);
	font-size: clamp(0.8rem, 1.7vw, 1.15rem);
	letter-spacing: 0.3em;
}

.fallback-copy h1 {
	margin: 0.45rem 0 0.8rem;
	color: #fff2c8;
	font-size: clamp(4.8rem, 15vw, 12rem);
	line-height: 0.82;
	text-shadow:
		0 0.25rem 0 #6d2a05,
		0 0 1.8rem rgba(232, 169, 70, 0.45);
}

.fallback-bar {
	width: min(16rem, 52vw);
	height: 0.42rem;
	margin: 1.25rem auto 0;
	border: 1px solid rgba(255, 242, 200, 0.34);
	background: rgba(0, 0, 0, 0.35);
	overflow: hidden;
}

.fallback-bar i {
	display: block;
	width: 45%;
	height: 100%;
	background: #fa4040;
	box-shadow: 0 0 1rem #fa4040;
	animation: fallbackBar 1.05s ease-in-out infinite;
}

@keyframes fallbackNeon {
	0%,
	100% {
		filter: brightness(1);
	}
	48% {
		filter: brightness(1.18);
	}
	51% {
		filter: brightness(0.78);
	}
	54% {
		filter: brightness(1.25);
	}
}

@keyframes fallbackFloor {
	from {
		background-position:
			0 0,
			0 0,
			0 0;
	}
	to {
		background-position:
			0 0,
			0 0,
			0 6rem;
	}
}

@keyframes fallbackBar {
	0% {
		transform: translateX(-105%);
	}
	100% {
		transform: translateX(225%);
	}
}
</style>
