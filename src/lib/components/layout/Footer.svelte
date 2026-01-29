<script lang="ts">
  import { base } from '$app/paths';
</script>

<footer class="bg-stone-900 text-stone-300 mt-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- About -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-4">About This Project</h3>
        <p class="text-sm">
          Relatable Stories translates stories from Iran's 2022 uprising into your local context,
          helping you understand and empathize with the human cost of repression.
        </p>
      </div>

      <!-- Links -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-4">Navigate</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="{base}/" class="hover:text-white transition-colors">Home</a></li>
          <li><a href="{base}/stories" class="hover:text-white transition-colors">Stories</a></li>
          <li><a href="{base}/about" class="hover:text-white transition-colors">About</a></li>
          <li><a href="{base}/take-action" class="hover:text-white transition-colors">Take Action</a></li>
        </ul>
      </div>

      <!-- Disclaimer -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-4">Important Note</h3>
        <p class="text-sm">
          These stories are based on documented testimonies from human rights organizations.
          Names and details have been adapted to protect identities and help readers relate to the experiences.
        </p>
      </div>
    </div>

    <div class="mt-8 pt-8 border-t border-stone-800 text-sm text-center">
      <p>Built with solidarity. For Mahsa, Nika, and all those who stood for freedom.</p>
    </div>
  </div>
</footer>
