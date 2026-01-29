<script lang="ts">
  import { contextualizationEnabled } from '$lib/stores/contextualization';

  function toggle() {
    contextualizationEnabled.update((v) => !v);
  }
</script>

<div class="contextualization-toggle">
  <button
    type="button"
    on:click={toggle}
    class="toggle-button"
    aria-label="Toggle contextualization"
  >
    <div class="toggle-content">
      <div class="toggle-label-wrapper">
        <span class="toggle-label {!$contextualizationEnabled ? 'active' : ''}"
          >Original Iranian</span
        >
      </div>

      <div class="toggle-switch {$contextualizationEnabled ? 'enabled' : 'disabled'}">
        <div class="toggle-slider"></div>
      </div>

      <div class="toggle-label-wrapper">
        <span class="toggle-label {$contextualizationEnabled ? 'active' : ''}">My Context</span>
      </div>
    </div>
  </button>
</div>

<style>
  .contextualization-toggle {
    display: inline-block;
  }

  .toggle-button {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-button:hover .toggle-switch {
    transform: scale(1.05);
  }

  .toggle-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .toggle-label-wrapper {
    min-width: 7rem;
    text-align: center;
  }

  .toggle-label {
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.4;
    transition: all 0.2s;
  }

  /* Highlight the active state */
  .toggle-label.active {
    opacity: 1;
    color: #ef4444;
  }

  .toggle-switch {
    position: relative;
    width: 3.5rem;
    height: 1.75rem;
    border-radius: 0.875rem;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .toggle-switch.disabled {
    background-color: rgba(255, 255, 255, 0.2);
  }

  :global(body.light) .toggle-switch.disabled {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.enabled {
    background-color: #ef4444;
  }

  .toggle-slider {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    width: 1.25rem;
    height: 1.25rem;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.enabled .toggle-slider {
    transform: translateX(1.75rem);
  }
</style>
