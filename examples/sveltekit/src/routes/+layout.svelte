<script lang="ts">
    import Nav from '$lib/Nav.svelte';
    import Footer from '$lib/Footer.svelte';

    let { children } = $props();
</script>

<Nav />
{@render children()}
<Footer />
