export default defineNuxtRouteMiddleware((to, from) => {
  const { isAdmin } = useAuth()
  
  // Se não for admin, volta para a home
  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
