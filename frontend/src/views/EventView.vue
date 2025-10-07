<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <div class="sticky top-0 bg-gray-800 border-b border-gray-700 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/')"
              class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
              </svg>
            </button>
            <div>
              <h1 class="text-xl font-bold">{{ event?.name || 'Event' }}</h1>
              <p v-if="event?.description" class="text-sm text-gray-400">{{ event.description }}</p>
            </div>
          </div>

          <!-- Lock Toggle Button -->
          <div class="relative">
            <button
              @click="cycleLockState"
              class="p-2.5 rounded-full transition-all duration-300 border-2"
              :class="lockState === 'locked' ?
                'bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30' :
                lockState === 'use' ?
                'bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30' :
                'bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30'"
              :title="lockState === 'locked' ? 'Locked - Click to unlock' : lockState === 'use' ? 'Use Mode - Click for full access' : 'Unlocked - Click to lock'"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <!-- Locked (Red) -->
                <path v-if="lockState === 'locked'" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" />
                <!-- Use mode (Blue - Play icon) -->
                <path v-else-if="lockState === 'use'" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5V7.5L16,12" />
                <!-- Unlocked (Green) -->
                <path v-else d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z" />
              </svg>
            </button>

            <!-- Unlock Code Popup -->
            <div
              v-if="showUnlockPopup"
              class="absolute top-full right-0 mt-2 bg-gray-800 border-2 border-amber-500 rounded-lg p-4 shadow-xl z-50 min-w-[250px]"
              @click.stop
            >
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-white">Enter Unlock Code</h3>
                <button
                  @click="closeUnlockPopup"
                  class="text-gray-400 hover:text-white transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>
              <form @submit.prevent="verifyUnlockCode">
                <input
                  v-model="unlockCodeInput"
                  type="password"
                  placeholder="Enter code"
                  ref="unlockInput"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-amber-500 text-white mb-2"
                  autocomplete="off"
                />
                <p v-if="unlockError" class="text-xs text-red-400 mb-2">{{ unlockError }}</p>
                <button
                  type="submit"
                  class="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-colors"
                >
                  Unlock
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Left Sidebar - Add Performance Form -->
        <div class="lg:col-span-1 space-y-6">
          <div :class="{ 'pointer-events-none opacity-50': lockState !== 'unlocked' }">
            <AddPerformanceForm
              :event-id="eventId"
              @performance-created="onPerformanceCreated"
            />
          </div>

          <!-- Performance Timeline -->
          <div class="bg-gradient-to-r from-gray-800 to-gray-700 border border-player-accent/30 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-player-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
              </svg>
              Timeline
            </h3>
            <div v-if="timelineItems.length > 0" class="space-y-2">
              <div
                v-for="item in timelineItems"
                :key="item.id"
                class="relative pl-6 pb-3 border-l-2 last:border-l-0 last:pb-0"
                :class="item.isDone ? 'border-green-500/30' : 'border-gray-600'"
              >
                <!-- Timeline dot -->
                <div
                  class="absolute left-[-5px] top-0 w-3 h-3 rounded-full border-2"
                  :class="item.isDone ? 'bg-green-500 border-green-400' : 'bg-gray-600 border-gray-500'"
                ></div>

                <!-- Timeline content -->
                <div
                  class="bg-gray-700/30 rounded p-2 hover:bg-gray-700/50 transition-colors cursor-pointer"
                  @click="selectPerformance(item)"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-medium text-white truncate">{{ item.name }}</span>
                    <span v-if="item.isDone" class="text-xs text-green-400">✓</span>
                  </div>
                  <div class="flex items-center gap-1 flex-wrap">
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                      :style="getTypeStyle(item.type)"
                    >
                      {{ item.type }}
                    </span>
                    <span class="text-[10px] text-gray-400 truncate">{{ item.performer }}</span>
                  </div>
                  <div v-if="item.expectedDuration" class="mt-1 text-[10px] text-gray-500">
                    {{ formatDuration(item.expectedDuration) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 text-xs py-4">
              No upcoming performances
            </div>
          </div>
        </div>

        <!-- Main Performance Cards -->
        <div class="lg:col-span-2 flex flex-col h-[calc(100vh-120px)]">
          <!-- Event Progress Wizard - Single Compact Rectangle -->
          <div class="mb-6 h-11">
            <div class="bg-gradient-to-br from-gray-800 to-gray-700 border border-player-accent/30 rounded-lg px-3 py-2 flex items-center justify-between gap-4">
              <!-- Progress Ring -->
              <div class="relative w-11 h-11 flex-shrink-0">
                <svg class="w-11 h-11 transform -rotate-90">
                  <circle cx="22" cy="22" r="20" stroke="currentColor" stroke-width="2.5" fill="none" class="text-gray-700" />
                  <circle cx="22" cy="22" r="20" stroke="currentColor" stroke-width="2.5" fill="none" :stroke-dasharray="circumference" :stroke-dashoffset="progressOffset" class="text-player-accent transition-all duration-500" stroke-linecap="round" />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-[0.75rem] font-bold text-player-accent">{{ completionPercentage }}%</span>
                </div>
              </div>

              <!-- Progress Count -->
              <div class="flex items-center gap-2 text-[0.75rem]">
                <span class="text-gray-400">Count:</span>
                <span class="text-gray-200 font-medium">{{ totalPerformancesCount }}</span>
                <span class="text-gray-600">|</span>
                <span class="text-green-400 font-medium">{{ completedPerformancesCount }}</span>
                <span class="text-gray-600">|</span>
                <span class="text-yellow-400 font-medium">{{ totalPerformancesCount - completedPerformancesCount }}</span>
              </div>

              <!-- Divider -->
              <div class="h-6 w-px bg-gray-600"></div>

              <!-- Expected Duration -->
              <div class="flex items-center gap-2 text-[0.75rem]">
                <svg class="w-2.5 h-2.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                </svg>
                <span class="text-gray-400">Time:</span>
                <span class="text-gray-200 font-medium">{{ totalDuration > 0 ? formatDuration(totalDuration) : 'N/A' }}</span>
                <span class="text-gray-600">|</span>
                <span class="text-green-400 font-medium">{{ totalDuration > 0 ? formatDuration(completedDuration) : 'N/A' }}</span>
                <span class="text-gray-600">|</span>
                <span class="text-yellow-400 font-medium">{{ totalDuration > 0 ? formatDuration(remainingDuration) : 'N/A' }}</span>
              </div>

              <!-- Divider -->
              <div class="h-6 w-px bg-gray-600"></div>

              <!-- Actual Duration -->
              <div class="flex items-center gap-2 text-[0.75rem]">
                <span class="text-gray-500">Actual:</span>
                <span class="text-blue-300 font-medium">{{ totalResolvedDuration > 0 ? formatResolvedDuration(totalResolvedDuration) : 'N/A' }}</span>
                <span class="text-gray-600">|</span>
                <span class="text-blue-200 font-medium">{{ totalResolvedDuration > 0 ? formatResolvedDuration(completedResolvedDuration) : 'N/A' }}</span>
                <span class="text-gray-600">|</span>
                <span class="text-blue-100 font-medium">{{ totalResolvedDuration > 0 ? formatResolvedDuration(remainingResolvedDuration) : 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Performance Info Card (Always Visible) -->
          <div
            class="mb-6 border border-player-accent/30 rounded-lg p-6 relative overflow-hidden cover-image-container h-[326px]"
            :class="[
              !selectedPerformance && event?.coverImage ? 'bg-cover bg-center cover-image-glow' : 'bg-gradient-to-r from-gray-800 to-gray-700'
            ]"
            :style="!selectedPerformance && event?.coverImage ? {
              backgroundImage: `url(${coverImageUrl})`,
              backgroundPosition: `${event.imagePosition?.x || 50}% ${event.imagePosition?.y || 50}%`
            } : {}"
            @mouseenter="lockState === 'unlocked' && !selectedPerformance && event?.coverImage ? showPositionButton = true : null"
            @mouseleave="lockState === 'unlocked' && !selectedPerformance && event?.coverImage ? showPositionButton = false : null"
          >
            <!-- Diagonal shine effect overlay (only when cover image exists) -->
            <div v-if="!selectedPerformance && event?.coverImage" class="diagonal-shine"></div>
            <!-- When a performance is selected -->
            <div v-if="selectedPerformance">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h3 class="text-base font-bold text-white mb-1.5">{{ selectedPerformance.name }}</h3>
                  <p class="text-sm text-gray-300 mb-2">by {{ selectedPerformance.performer }}</p>
                  <div class="flex flex-wrap gap-2 text-sm">
                    <div class="flex items-center gap-1.5">
                      <span class="text-gray-400">Type:</span>
                      <span class="px-2 py-0.5 bg-blue-600/20 text-blue-300 rounded text-xs">{{ selectedPerformance.type }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-gray-400">Mode:</span>
                      <span class="px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded text-xs">{{ selectedPerformance.mode }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-gray-400">Status:</span>
                      <span :class="selectedPerformance.isDone ? 'px-2 py-0.5 bg-green-600/20 text-green-300 rounded text-xs' : 'px-2 py-0.5 bg-yellow-600/20 text-yellow-300 rounded text-xs'">
                        {{ selectedPerformance.isDone ? 'Completed' : 'Pending' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-gray-400">Tracks:</span>
                      <span class="px-2 py-0.5 bg-gray-600/50 text-gray-300 rounded text-xs">
                        {{ selectedPerformance.tracks.length === 0 ? 'No tracks' : selectedPerformance.tracks.length }}
                      </span>
                    </div>
                    <div v-if="selectedPerformance.expectedDuration" class="flex items-center gap-1.5">
                      <span class="text-gray-400">Duration:</span>
                      <span class="px-2 py-0.5 bg-blue-600/20 text-blue-300 rounded text-xs">
                        {{ formatDuration(selectedPerformance.expectedDuration) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-400 mb-1">Created</p>
                  <p class="text-sm text-gray-300">{{ formatDate(selectedPerformance.createdAt) }}</p>
                </div>
              </div>

              <!-- Track Summary for Selected Performance (non-interactive, just counts) -->
              <div v-if="selectedPerformance.tracks.length > 0" class="border-t border-gray-600 pt-4 pb-8">
                <h4 class="text-[11px] font-medium text-gray-400 mb-2">Track Summary</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div class="text-center p-2 bg-gray-700/30 rounded">
                    <p class="text-base font-semibold text-white">{{ selectedPerformance.tracks.length }}</p>
                    <p class="text-[11px] text-gray-400">Total Tracks</p>
                  </div>
                  <div class="text-center p-2 bg-green-600/20 rounded">
                    <p class="text-base font-semibold text-green-300">{{ selectedPerformance.tracks.filter(t => t.isCompleted).length }}</p>
                    <p class="text-[11px] text-gray-400">Completed</p>
                  </div>
                  <div class="text-center p-2 bg-yellow-600/20 rounded">
                    <p class="text-base font-semibold text-yellow-300">{{ selectedPerformance.tracks.filter(t => !t.isCompleted).length }}</p>
                    <p class="text-[11px] text-gray-400">Remaining</p>
                  </div>
                  <div class="text-center p-2 bg-purple-600/20 rounded">
                    <p class="text-base font-semibold text-purple-300">{{ Math.round((selectedPerformance.tracks.filter(t => t.isCompleted).length / selectedPerformance.tracks.length) * 100) }}%</p>
                    <p class="text-[11px] text-gray-400">Progress</p>
                  </div>
                </div>

                <!-- Currently Playing Track -->
                <div v-if="playerStore.currentTrack && selectedPerformance.tracks.some(t => t.id === playerStore.currentTrack?.id)" class="mt-3 p-2 bg-player-accent/10 border border-player-accent/30 rounded">
                  <div class="flex items-center gap-2">
                    <div class="flex-shrink-0">
                      <div class="w-7 h-7 bg-player-accent/20 rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-player-accent" :class="{ 'animate-pulse': playState.isPlaying }" fill="currentColor" viewBox="0 0 24 24">
                          <path v-if="playState.isPlaying" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                          <path v-else d="M8,5V19L11,19V5M13,5V19L16,19V5" />
                        </svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-medium text-white truncate">{{ playerStore.currentTrack.filename }}</p>
                    </div>
                    <div class="flex-shrink-0 text-right">
                      <p class="text-[10px] text-player-accent font-mono">{{ formattedCurrentTime }} / {{ formattedDuration }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="border-t border-gray-600 pt-4 pb-8 text-center">
                <p class="text-gray-500 text-xs">No tracks available for this performance</p>
              </div>
            </div>

            <!-- When no performance is selected - show event overview -->
            <div v-else class="h-full flex flex-col justify-center text-center relative">
              <!-- Position Button (appears on hover when cover image exists) -->
              <button
                v-if="event?.coverImage && showPositionButton && !isPositioning"
                @click="startPositioning"
                class="absolute bottom-4 right-4 bg-black/70 hover:bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm border border-white/20 z-10"
              >
                🎨 Position Image
              </button>

              <!-- Positioning Mode Overlay -->
              <div v-if="isPositioning" class="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-lg">
                <div class="text-center text-white">
                  <p class="text-lg font-medium mb-2">Click to position image</p>
                  <p class="text-sm text-gray-300 mb-4">Click anywhere to set the focal point</p>
                  <button
                    @click="finishPositioning"
                    class="bg-player-accent hover:bg-green-400 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>

              <!-- Click handler for positioning -->
              <div
                v-if="isPositioning"
                @click="handleImageClick"
                class="absolute inset-0 cursor-crosshair z-10"
              ></div>

              <!-- Content overlay for when there's a cover image -->
              <div v-if="event?.coverImage" class="relative z-10">
                <!-- Just empty space to allow the background image to show -->
              </div>

              <!-- Fallback when no cover image -->
              <div v-else>
                <p class="text-gray-500 text-lg mb-2">Event Overview</p>
                <p class="text-gray-600 text-sm">Select a performance card to view details</p>
                <p class="text-gray-700 text-xs mt-4">Add a cover image when creating events</p>
              </div>
            </div>

          </div>

          <!-- Performances Section (Fixed Height) -->
          <div class="flex-1 flex flex-col min-h-0">
            <div class="mb-3">
              <!-- Search Box -->
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search performances, performers, types..."
                  class="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-player-accent text-white placeholder-gray-400"
                />
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <!-- Clear button -->
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="isLoading" class="flex-1 flex items-center justify-center">
              <p class="text-gray-400">Loading performances...</p>
            </div>

            <div v-else-if="sortedItems.active.length === 0 && sortedItems.completed.length === 0" class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <p v-if="searchQuery.trim()" class="text-gray-400 mb-2">
                  No results found for "{{ searchQuery }}"
                </p>
                <p v-else class="text-gray-400 mb-2">
                  No performances created yet. Create your first item!
                </p>
                <button
                  v-if="searchQuery.trim()"
                  @click="searchQuery = ''"
                  class="text-player-accent hover:text-green-400 text-sm underline"
                >
                  Clear search
                </button>
              </div>
            </div>

            <div v-else class="flex-1 overflow-hidden">
              <div class="h-full overflow-y-auto pr-2 pb-6">
                <!-- Active Performances Section -->
                <div v-if="sortedItems.active.length > 0">
                  <h3 class="text-sm font-semibold text-white mb-2 sticky top-0 bg-gray-900 py-2 z-10">
                    Performances
                  </h3>
                  <div ref="performanceContainer" class="space-y-3">
                    <template v-for="item in sortedItems.active" :key="item.id">
                      <PerformanceCard
                        v-if="item.type !== 'Break'"
                        :performance="item"
                        :is-selected="selectedPerformanceId === item.id"
                        :disabled="lockState === 'locked' || !!(selectedPerformanceId && selectedPerformanceId !== item.id)"
                        @select="(p) => lockState !== 'locked' && selectPerformance(p)"
                        @toggle-done="(p) => lockState !== 'locked' && toggleDone(p)"
                        @edit="(p) => lockState === 'unlocked' && editPerformance(p)"
                        @delete="(p) => lockState === 'unlocked' && deletePerformance(p)"
                        @track-selected="(t) => lockState !== 'locked' && onTrackSelected(t)"
                        @toggle-track-completion="(t) => lockState !== 'locked' && toggleTrackCompletion(t)"
                        @delete-track="(t) => lockState === 'unlocked' && deleteTrack(t)"
                        class="performance-card-item"
                        :data-id="item.id"
                      />
                      <BreakCard
                        v-else
                        :break-item="convertPerformanceToBreak(item)"
                        :disabled="lockState === 'locked' || !!selectedPerformanceId"
                        @select="() => {}"
                        @toggle-done="() => lockState !== 'locked' && toggleDone(item)"
                        @delete="() => lockState === 'unlocked' && deletePerformance(item)"
                        class="break-card-item"
                        :data-id="item.id"
                      />
                    </template>
                  </div>
                </div>

                <!-- Completed Section -->
                <div v-if="sortedItems.completed.length > 0" class="mt-8">
                  <h3 class="text-lg font-semibold text-gray-400 mb-3 sticky top-0 bg-gray-900 py-2 z-10">
                    Completed
                  </h3>
                  <div ref="completedContainer" class="space-y-3">
                    <template v-for="item in sortedItems.completed" :key="item.id">
                      <PerformanceCard
                        v-if="item.type !== 'Break'"
                        :performance="item"
                        :is-selected="false"
                        :disabled="lockState === 'locked'"
                        @select="(p) => lockState !== 'locked' && selectPerformance(p)"
                        @toggle-done="(p) => lockState !== 'locked' && toggleDone(p)"
                        @edit="(p) => lockState === 'unlocked' && editPerformance(p)"
                        @delete="(p) => lockState === 'unlocked' && deletePerformance(p)"
                        @track-selected="(t) => lockState !== 'locked' && onTrackSelected(t)"
                        @toggle-track-completion="(t) => lockState !== 'locked' && toggleTrackCompletion(t)"
                        @delete-track="(t) => lockState === 'unlocked' && deleteTrack(t)"
                        class="performance-card-item completed-item"
                        :data-id="item.id"
                      />
                      <BreakCard
                        v-else
                        :break-item="convertPerformanceToBreak(item)"
                        :disabled="lockState === 'locked'"
                        @select="() => {}"
                        @toggle-done="() => lockState !== 'locked' && toggleDone(item)"
                        @delete="() => lockState === 'unlocked' && deletePerformance(item)"
                        class="break-card-item completed-item"
                        :data-id="item.id"
                      />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Media Player -->
        <div class="lg:col-span-1 space-y-6">
          <MediaPlayer />

          <!-- Performance Type Distribution -->
          <div class="bg-gradient-to-r from-gray-800 to-gray-700 border border-player-accent/30 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-player-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11,2V22C5.9,21.5 2,17.2 2,12C2,6.8 5.9,2.5 11,2M13,2V11H22C21.5,6.2 17.8,2.5 13,2M13,13V22C17.7,21.5 21.5,17.8 22,13H13Z" />
              </svg>
              Performance Types
            </h3>
            <div v-if="performanceTypeDistribution.length > 0" class="space-y-3">
              <div
                v-for="typeData in performanceTypeDistribution"
                :key="typeData.type"
                class="relative"
              >
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="text-xs font-medium px-2 py-0.5 rounded-full border"
                    :style="getTypeStyle(typeData.type)"
                  >
                    {{ typeData.type }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ typeData.count }} ({{ typeData.percentage }}%)
                  </span>
                </div>
                <div class="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :style="{
                      width: `${typeData.percentage}%`,
                      backgroundColor: getTypeStyle(typeData.type).borderColor
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 text-xs py-2">
              No performances yet
            </div>
          </div>

          <!-- Artist Cloud Widget -->
          <div class="bg-gradient-to-r from-gray-800 to-gray-700 border border-player-accent/30 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-player-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
              </svg>
              Artists
            </h3>
            <div v-if="artistCloud.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="artist in artistCloud"
                :key="artist.name"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 cursor-default"
                :style="{
                  backgroundColor: `rgba(16, 185, 129, ${0.1 + (artist.count / maxArtistCount) * 0.2})`,
                  borderColor: `rgba(16, 185, 129, ${0.2 + (artist.count / maxArtistCount) * 0.3})`,
                  borderWidth: '1px',
                  color: `rgb(${110 + (artist.count / maxArtistCount) * 145}, ${231 - (artist.count / maxArtistCount) * 50}, ${183 - (artist.count / maxArtistCount) * 50})`
                }"
                :title="`${artist.count} performance${artist.count !== 1 ? 's' : ''}`"
              >
                {{ artist.name }}
                <span class="ml-1 opacity-70">{{ artist.count }}</span>
              </span>
            </div>
            <div v-else class="text-center text-gray-500 text-xs py-2">
              No artists yet
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Performance Modal -->
    <EditPerformanceModal
      v-if="performanceToEdit"
      :is-visible="editModalVisible"
      :performance="performanceToEdit"
      :event-id="eventId"
      @close="closeEditModal"
      @updated="onPerformanceUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { usePlayerStore } from '@/stores/player'
import AddPerformanceForm from '@/components/AddPerformanceForm.vue'
import PerformanceCard from '@/components/PerformanceCard.vue'
import BreakCard from '@/components/BreakCard.vue'
import MediaPlayer from '@/components/MediaPlayer.vue'
import EditPerformanceModal from '@/components/EditPerformanceModal.vue'
import Sortable from 'sortablejs'
import type { Performance, Track } from '@/types'

const route = useRoute()
const eventStore = useEventStore()
const playerStore = usePlayerStore()

// Player state references
const playState = computed(() => playerStore.playState)
const formattedCurrentTime = computed(() => playerStore.formattedCurrentTime)
const formattedDuration = computed(() => playerStore.formattedDuration)

const eventId = route.params.eventId as string
const performanceContainer = ref<HTMLElement>()
const searchQuery = ref('')
let sortable: Sortable | null = null

// Lock state: 'locked' | 'use' | 'unlocked'
type LockState = 'locked' | 'use' | 'unlocked'
const lockState = ref<LockState>('locked')
const showUnlockPopup = ref(false)
const unlockCodeInput = ref('')
const unlockError = ref('')
const unlockInput = ref<HTMLInputElement>()

// Computed helper for backward compatibility
const isLocked = computed(() => lockState.value === 'locked')
const isUseMode = computed(() => lockState.value === 'use')
const isFullyUnlocked = computed(() => lockState.value === 'unlocked')

function cycleLockState() {
  if (lockState.value === 'unlocked') {
    // Unlocked -> Locked (no password needed)
    lockState.value = 'locked'
  } else if (lockState.value === 'locked') {
    // Locked -> Show unlock popup
    showUnlockPopup.value = true
    unlockCodeInput.value = ''
    unlockError.value = ''
    nextTick(() => {
      unlockInput.value?.focus()
    })
  } else if (lockState.value === 'use') {
    // Use -> Show unlock popup for full access
    showUnlockPopup.value = true
    unlockCodeInput.value = ''
    unlockError.value = ''
    nextTick(() => {
      unlockInput.value?.focus()
    })
  }
}

function closeUnlockPopup() {
  showUnlockPopup.value = false
  unlockCodeInput.value = ''
  unlockError.value = ''
}

async function verifyUnlockCode() {
  if (!unlockCodeInput.value.trim()) {
    unlockError.value = 'Please enter unlock code'
    return
  }

  try {
    const response = await fetch(`/api/events/${eventId}/verify-unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ unlockCode: unlockCodeInput.value.trim() })
    })

    if (response.ok) {
      if (lockState.value === 'locked') {
        // From locked -> use mode
        lockState.value = 'use'
      } else if (lockState.value === 'use') {
        // From use mode -> fully unlocked
        lockState.value = 'unlocked'
      }
      closeUnlockPopup()
    } else {
      unlockError.value = 'Incorrect unlock code'
      unlockCodeInput.value = ''
    }
  } catch (error) {
    console.error('Error verifying unlock code:', error)
    unlockError.value = 'Failed to verify code'
  }
}

const event = computed(() => eventStore.selectedEvent)
const selectedPerformanceId = computed(() => eventStore.selectedPerformanceId)
const isLoading = computed(() => eventStore.isLoading)
const sortedPerformances = computed(() => eventStore.sortedPerformances)
const selectedPerformance = computed(() => {
  if (!selectedPerformanceId.value) return null
  return sortedPerformances.value.find(p => p.id === selectedPerformanceId.value)
})

// Cover image state
const showPositionButton = ref(false)
const isPositioning = ref(false)
const coverImageUrl = computed(() => {
  if (event.value?.coverImage) {
    return `/api/events/${eventId}/cover`
  }
  return undefined
})

// Edit modal state
const editModalVisible = ref(false)
const performanceToEdit = ref<Performance | null>(null)

// All items are now performances (including breaks which have type='Break')
const sortedItems = computed(() => {
  let allItems = [...sortedPerformances.value]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    allItems = allItems.filter(item => {
      // Search in performance name, performer, type, and mode
      const searchFields = [
        item.name,
        item.performer,
        item.type,
        item.mode
      ].filter(Boolean).map(field => field.toLowerCase())

      // Also search in track filenames
      if (item.tracks && item.tracks.length > 0) {
        const trackNames = item.tracks.map((track: any) => track.filename.toLowerCase())
        searchFields.push(...trackNames)
      }

      return searchFields.some(field => field.includes(query))
    })
  }

  // Separate into active and completed
  const activeItems = allItems.filter(item => !item.isDone)
  const completedItems = allItems.filter(item => item.isDone)

  return { active: activeItems, completed: completedItems }
})

// Duration calculations (expectedDuration - manually entered, in minutes)
const totalDuration = computed(() => {
  const allItems = [...sortedItems.value.active, ...sortedItems.value.completed]
  return allItems.reduce((total, item) => {
    return total + (item.expectedDuration || 0)
  }, 0)
})

const completedDuration = computed(() => {
  return sortedItems.value.completed.reduce((total, item) => {
    return total + (item.expectedDuration || 0)
  }, 0)
})

const remainingDuration = computed(() => {
  return totalDuration.value - completedDuration.value
})

// Resolved duration calculations (from track durations, in seconds)
const calculateResolvedDuration = (performance: Performance): number => {
  if (!performance.tracks || performance.tracks.length === 0) return 0
  return performance.tracks.reduce((total, track) => {
    return total + (track.duration || 0)
  }, 0)
}

const totalResolvedDuration = computed(() => {
  const allItems = [...sortedItems.value.active, ...sortedItems.value.completed]
  return allItems.reduce((total, item) => {
    return total + calculateResolvedDuration(item)
  }, 0)
})

const completedResolvedDuration = computed(() => {
  return sortedItems.value.completed.reduce((total, item) => {
    return total + calculateResolvedDuration(item)
  }, 0)
})

const remainingResolvedDuration = computed(() => {
  return totalResolvedDuration.value - completedResolvedDuration.value
})

function formatDuration(minutes: number): string {
  if (minutes === 0) return '0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${Math.ceil(mins)}m`
}

function formatResolvedDuration(seconds: number): string {
  if (seconds === 0) return '0m'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.ceil((seconds % 3600) / 60)

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

// Artist cloud computation
interface ArtistCloudItem {
  name: string
  count: number
}

function parsePerformerNames(performer: string): string[] {
  if (!performer || !performer.trim()) return []

  // Split by comma, ampersand, and "and"
  return performer
    .split(/[,&]|\band\b/i)
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .flatMap(name => {
      // Further split by spaces if multiple words that look like separate names
      // But only if they contain capital letters indicating separate names
      const words = name.split(/\s+/)
      if (words.length === 1) return [name]
      return [name] // Keep as full name
    })
}

const artistCloud = computed<ArtistCloudItem[]>(() => {
  const allItems = [...sortedItems.value.active, ...sortedItems.value.completed]
  const artistMap = new Map<string, number>()

  allItems.forEach(item => {
    if (item.type !== 'Break' && item.performer) {
      const artists = parsePerformerNames(item.performer)
      artists.forEach(artist => {
        const normalized = artist.trim()
        if (normalized) {
          artistMap.set(normalized, (artistMap.get(normalized) || 0) + 1)
        }
      })
    }
  })

  return Array.from(artistMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const maxArtistCount = computed(() => {
  if (artistCloud.value.length === 0) return 1
  return Math.max(...artistCloud.value.map(a => a.count))
})

// Timeline items - shows next 5 upcoming performances (not completed)
const timelineItems = computed(() => {
  const upcoming = sortedPerformances.value.filter(p => !p.isDone)
  return upcoming.slice(0, 5)
})

// Completion rate progress ring
const totalPerformancesCount = computed(() => sortedPerformances.value.length)
const completedPerformancesCount = computed(() => sortedPerformances.value.filter(p => p.isDone).length)
const completionPercentage = computed(() => {
  if (totalPerformancesCount.value === 0) return 0
  return Math.round((completedPerformancesCount.value / totalPerformancesCount.value) * 100)
})

const circumference = computed(() => 2 * Math.PI * 20) // radius is 20
const progressOffset = computed(() => {
  const progress = completionPercentage.value / 100
  return circumference.value * (1 - progress)
})

// Performance type distribution
interface TypeDistribution {
  type: string
  count: number
  percentage: number
}

const performanceTypeDistribution = computed<TypeDistribution[]>(() => {
  const allItems = [...sortedItems.value.active, ...sortedItems.value.completed]
  const performancesOnly = allItems.filter(item => item.type !== 'Break')
  const typeMap = new Map<string, number>()

  performancesOnly.forEach(item => {
    const type = item.type
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })

  const total = performancesOnly.length
  if (total === 0) return []

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
})

// Color schemes for performance types (reused from PerformanceCard)
function getTypeStyle(type: string): { backgroundColor: string; borderColor: string; color: string } {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    'Song': { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: 'rgb(147, 197, 253)' },
    'Dance': { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: 'rgb(249, 168, 212)' },
    'Recitation': { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: 'rgb(216, 180, 254)' },
    'Break': { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: 'rgb(253, 224, 71)' }
  }

  const style = styles[type] || { bg: 'rgba(107, 114, 128, 0.15)', border: 'rgba(107, 114, 128, 0.4)', text: 'rgb(156, 163, 175)' }
  return {
    backgroundColor: style.bg,
    borderColor: style.border,
    color: style.text
  }
}

onMounted(async () => {
  if (eventId) {
    await eventStore.selectEvent(eventId)
  }
  document.addEventListener('keydown', handleKeydown)
})

// Watch for changes in combined items and reinitialize sortable
watch(sortedItems, async () => {
  await nextTick()
  initializeSortable()
}, { immediate: true })

// Watch for lock state changes and update sortable
watch(lockState, () => {
  if (sortable) {
    // Disable dragging in both locked and use mode, only allow in unlocked
    sortable.option('disabled', lockState.value !== 'unlocked')
  }
})

onUnmounted(() => {
  if (sortable) {
    sortable.destroy()
  }
  document.removeEventListener('keydown', handleKeydown)
})

function initializeSortable() {
  // Clean up existing sortable instance
  if (sortable) {
    sortable.destroy()
    sortable = null
  }

  if (performanceContainer.value && sortedItems.value.active.length > 0) {
    console.log('Initializing sortable with', sortedItems.value.active.length, 'items')
    sortable = new Sortable(performanceContainer.value, {
      animation: 200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      swapThreshold: 0.65,
      invertSwap: false,
      direction: 'vertical',
      removeCloneOnHide: true,
      disabled: lockState.value !== 'unlocked',
      onStart: (evt) => {
        console.log('Drag started', evt)
      },
      onEnd: async (evt: Sortable.SortableEvent) => {
        console.log('Drag ended', evt)
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          const newOrder = Array.from(performanceContainer.value!.children)
            .map(el => (el as HTMLElement).dataset.id!)
            .filter(id => id)
          console.log('Reordering to:', newOrder)
          await reorderPerformances(newOrder)
        }
      }
    })
    console.log('Sortable initialized:', sortable)
  }
}

async function reorderPerformances(newOrder: string[]) {
  try {
    await eventStore.reorderPerformances(eventId, newOrder)
    console.log('Performances reordering completed successfully')
  } catch (error) {
    console.error('Error reordering performances:', error)
    await eventStore.loadEventPerformances(eventId)
  }
}

async function onPerformanceCreated(performance: Performance) {
  // Backend already assigns order: len(performances) which is correct
  // Just reload to get the latest state
  // No need to manually update order - avoid race condition
  await eventStore.loadEventPerformances(eventId)
}

function selectPerformance(performance: Performance) {
  if (selectedPerformanceId.value === performance.id) {
    eventStore.selectPerformance(null)
  } else {
    eventStore.selectPerformance(performance.id)
  }
}

async function toggleDone(performance: Performance) {
  const wasSelected = selectedPerformanceId.value === performance.id
  const wasDone = performance.isDone

  // If unmarking as done, we need to move it to top of active list
  if (wasDone) {
    // Find the minimum order in active items
    const activeItems = sortedPerformances.value.filter(p => !p.isDone && p.id !== performance.id)
    const minOrder = activeItems.length > 0 ? Math.min(...activeItems.map(p => p.order)) : 0

    // Update the performance to be at the top (order -1 or less than min)
    try {
      await fetch(`/api/events/${eventId}/performances/${performance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDone: false,
          order: minOrder - 1
        })
      })
      await eventStore.loadEventPerformances(eventId)
    } catch (error) {
      console.error('Error updating performance:', error)
    }
  } else {
    // Marking as done - just toggle the status
    await eventStore.togglePerformanceDone(eventId, performance)
  }

  // If the performance was marked as done and was selected, deselect it
  if (wasSelected && !wasDone) {
    eventStore.selectPerformance(null)
  }
}

function editPerformance(performance: Performance) {
  performanceToEdit.value = performance
  editModalVisible.value = true
}

function closeEditModal() {
  editModalVisible.value = false
  performanceToEdit.value = null
}

async function onPerformanceUpdated(updatedPerformance: Performance) {
  // Refresh the performances list to get the latest data
  await eventStore.loadEventPerformances(eventId)
  closeEditModal()
}

async function deletePerformance(performance: Performance) {
  if (confirm(`Are you sure you want to delete "${performance.name}" by ${performance.performer}?`)) {
    await eventStore.deletePerformance(eventId, performance.id)
    if (selectedPerformanceId.value === performance.id) {
      eventStore.selectPerformance(null)
    }
  }
}

function onTrackSelected(track: Track) {
  // Only play tracks from the selected performance
  if (selectedPerformanceId.value) {
    const updatedTrack = {
      ...track,
      url: track.url?.replace('/api/performances/', `/api/events/${eventId}/performances/`)
    }
    playerStore.loadTrack(updatedTrack)
  }
}

async function toggleTrackCompletion(track: Track) {
  if (!selectedPerformanceId.value) return

  try {
    const response = await fetch(`/api/events/${eventId}/performances/${selectedPerformanceId.value}/tracks/${track.id}/completion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !track.isCompleted })
    })

    if (!response.ok) throw new Error('Failed to update track completion')

    // Reload performances to get updated data
    await eventStore.loadEventPerformances(eventId)
  } catch (error) {
    console.error('Error updating track completion:', error)
    alert('Failed to update track completion. Please try again.')
  }
}

async function deleteTrack(track: Track) {
  if (!selectedPerformanceId.value) return

  if (!confirm(`Are you sure you want to delete "${track.filename}"?`)) {
    return
  }

  try {
    const response = await fetch(`/api/events/${eventId}/performances/${selectedPerformanceId.value}/tracks/${track.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) throw new Error('Failed to delete track')

    // Reload performances to get updated data with recalculated resolved duration
    await eventStore.loadEventPerformances(eventId)
  } catch (error) {
    console.error('Error deleting track:', error)
    alert('Failed to delete track. Please try again.')
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Helper function to convert Performance with type='Break' to Break format
function convertPerformanceToBreak(performance: Performance): any {
  return {
    id: performance.id,
    name: performance.name,
    type: performance.mode as any, // mode contains the break type
    isDone: performance.isDone,
    createdAt: performance.createdAt,
    order: performance.order,
    expectedDuration: performance.expectedDuration
  }
}

// Cover image positioning functions
function startPositioning() {
  isPositioning.value = true
  showPositionButton.value = false
}

function finishPositioning() {
  isPositioning.value = false
}

async function handleImageClick(event: MouseEvent) {
  if (!isPositioning.value || !event.currentTarget) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  try {
    const response = await fetch(`/api/events/${eventId}/position`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y })
    })

    if (response.ok) {
      // Update local event data
      await eventStore.selectEvent(eventId)
      console.log('Image position updated successfully')
    }
  } catch (error) {
    console.error('Error updating image position:', error)
  }
}

// Handle space key for play/pause
function handleKeydown(event: KeyboardEvent) {
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault()
    // Media player will handle this through the player store
  }
}
</script>

<style scoped>
.sortable-ghost {
  opacity: 0.3;
  background: rgba(16, 185, 129, 0.1) !important;
  border: 2px dashed rgba(16, 185, 129, 0.5) !important;
}

.sortable-chosen {
  cursor: grabbing !important;
}

.sortable-drag {
  opacity: 1 !important;
  cursor: grabbing !important;
  transform: rotate(2deg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
  transition: none !important;
}

.performance-card-item {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.break-card-item {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* Ensure performance cards have proper styling for drag and drop */
:deep(.performance-card) {
  background: rgba(55, 65, 81, 1);
  border: 1px solid rgba(75, 85, 99, 1);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.performance-card:hover) {
  background: rgba(75, 85, 99, 1);
}

:deep(.performance-card.selected) {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
}

:deep(.performance-card.done) {
  opacity: 0.6;
  background: rgba(55, 65, 81, 0.5);
}

:deep(.drag-handle) {
  cursor: grab !important;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

:deep(.drag-handle:active) {
  cursor: grabbing !important;
}

:deep(.sortable-chosen .drag-handle) {
  cursor: grabbing !important;
}

/* Completed items styling */
:deep(.completed-item) {
  opacity: 0.7;
}

:deep(.completed-item:hover) {
  opacity: 0.85;
}

/* Custom scrollbar styling for performance list */
:deep(.h-full.overflow-y-auto) {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.6) rgba(31, 41, 55, 0.2);
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar) {
  width: 8px;
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-track) {
  background: rgba(31, 41, 55, 0.2);
  border-radius: 4px;
  margin: 4px 0;
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-thumb) {
  background: linear-gradient(180deg, rgba(75, 85, 99, 0.7) 0%, rgba(55, 65, 81, 0.8) 100%);
  border-radius: 4px;
  border: 1px solid rgba(75, 85, 99, 0.3);
  transition: all 0.2s ease;
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.6) 0%, rgba(16, 185, 129, 0.4) 100%);
  border-color: rgba(16, 185, 129, 0.5);
  transform: scaleX(1.2);
}

:deep(.h-full.overflow-y-auto::-webkit-scrollbar-thumb:active) {
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%);
  border-color: rgba(16, 185, 129, 0.7);
}

/* Diagonal shine animation for cover image */
.diagonal-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 50%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    transparent 40%,
    rgba(255, 255, 255, 0.1) 45%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.1) 55%,
    transparent 60%,
    transparent 100%
  );
  transform: rotate(45deg);
  animation: diagonal-shine 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes diagonal-shine {
  0% {
    left: -50%;
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  20% {
    left: 150%;
    opacity: 1;
  }
  25% {
    opacity: 0;
  }
  100% {
    left: 150%;
    opacity: 0;
  }
}

/* Ensure cover image container can show the shine effect */
.cover-image-container {
  position: relative;
}

/* Outer glow effect for cover image */
.cover-image-glow {
  box-shadow:
    0 0 20px rgba(16, 185, 129, 0.3),
    0 0 40px rgba(16, 185, 129, 0.2),
    0 0 60px rgba(16, 185, 129, 0.1),
    0 0 80px rgba(16, 185, 129, 0.05);
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(16, 185, 129, 0.3),
      0 0 40px rgba(16, 185, 129, 0.2),
      0 0 60px rgba(16, 185, 129, 0.1),
      0 0 80px rgba(16, 185, 129, 0.05);
  }
  50% {
    box-shadow:
      0 0 25px rgba(16, 185, 129, 0.4),
      0 0 50px rgba(16, 185, 129, 0.3),
      0 0 75px rgba(16, 185, 129, 0.2),
      0 0 100px rgba(16, 185, 129, 0.1);
  }
}
</style>