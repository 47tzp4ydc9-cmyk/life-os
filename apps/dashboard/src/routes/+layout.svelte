<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>investment os</title>
</svelte:head>

<header>
	<a href="/" class="brand">investment os</a>
</header>

<main>
	{@render children()}
</main>
