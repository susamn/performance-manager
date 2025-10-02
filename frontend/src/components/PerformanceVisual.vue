<template>
  <div class="performance-visual">
    <div class="visual-container">
      <!-- Default subtle wave animation -->
      <div v-if="visualType === 'wave'" class="wave-visual">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>

      <!-- Floating particles for future use -->
      <div v-else-if="visualType === 'particles'" class="particles-visual">
        <div v-for="n in 8" :key="n" class="particle" :style="{ animationDelay: `${n * 0.3}s` }"></div>
      </div>

      <!-- Pulse circles for future use -->
      <div v-else-if="visualType === 'pulse'" class="pulse-visual">
        <div class="pulse-circle pulse-1"></div>
        <div class="pulse-circle pulse-2"></div>
        <div class="pulse-circle pulse-3"></div>
      </div>

      <!-- Default wave if no type specified -->
      <div v-else class="wave-visual">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>
    </div>

    <!-- Overlay text for when no performance is selected -->
    <div class="visual-text">
      <p class="text-gray-500 text-sm">Select a performance to view details</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visualType?: 'wave' | 'particles' | 'pulse'
}>()
</script>

<style scoped>
.performance-visual {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.visual-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.6;
}

.visual-text {
  position: relative;
  z-index: 2;
  text-align: center;
}

/* Wave Visual */
.wave-visual {
  position: relative;
  width: 100%;
  height: 100%;
}

.wave {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid rgba(16, 185, 129, 0.6);
  animation: wave-expand 4s infinite ease-in-out;
}

.wave-1 {
  width: 120px;
  height: 120px;
  animation-delay: 0s;
}

.wave-2 {
  width: 80px;
  height: 80px;
  animation-delay: 1.3s;
}

.wave-3 {
  width: 160px;
  height: 160px;
  animation-delay: 2.6s;
}

@keyframes wave-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.1);
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

/* Particles Visual */
.particles-visual {
  position: relative;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(16, 185, 129, 0.4);
  border-radius: 50%;
  animation: float 6s infinite ease-in-out;
}

.particle:nth-child(1) { top: 20%; left: 20%; }
.particle:nth-child(2) { top: 30%; left: 70%; }
.particle:nth-child(3) { top: 60%; left: 30%; }
.particle:nth-child(4) { top: 70%; left: 80%; }
.particle:nth-child(5) { top: 40%; left: 50%; }
.particle:nth-child(6) { top: 80%; left: 60%; }
.particle:nth-child(7) { top: 25%; left: 40%; }
.particle:nth-child(8) { top: 55%; left: 75%; }

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 0.6;
  }
}

/* Pulse Visual */
.pulse-visual {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
  animation: pulse 3s infinite ease-in-out;
}

.pulse-1 {
  width: 50px;
  height: 50px;
  animation-delay: 0s;
}

.pulse-2 {
  width: 70px;
  height: 70px;
  animation-delay: 1s;
}

.pulse-3 {
  width: 90px;
  height: 90px;
  animation-delay: 2s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.1;
  }
}
</style>