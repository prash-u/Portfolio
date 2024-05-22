// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
    // Register the service worker from a specified path
    navigator.serviceWorker.register('/sw.js')
    .then(function(registration) {
        // Registration was successful
        console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(function(error) {
        // Registration failed
        console.log('Service Worker registration failed:', error);
    });
}
