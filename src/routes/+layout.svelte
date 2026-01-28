<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';
</script>

<svelte:head>
  <title>Relatable Stories - Iran Uprising Stories in Your Context</title>
  <meta
    name="description"
    content="Experience stories from Iran's 2022 uprising, translated into your local context to help you understand and empathize."
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="min-h-screen">
  <Header />
  <main class="pt-16">
    <slot />
  </main>
</div>
