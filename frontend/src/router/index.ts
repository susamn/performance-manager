import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventView from '../views/EventView.vue'
import LiveView from '../views/LiveView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/events/:eventId',
      name: 'event',
      component: EventView,
      props: true
    },
    {
      path: '/events/:eventId/live',
      name: 'live',
      component: LiveView,
      props: true
    }
  ]
})

export default router