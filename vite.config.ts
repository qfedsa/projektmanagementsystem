import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'dhtmlx-gantt', 'lucide-react']
  },
  server: {
    host: true
  }
});
