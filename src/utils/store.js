const Store = require('electron-store');

// Create store with migrations to handle version updates
const store = new Store({
    name: 'k8s-electron-manager-config',
    defaults: {
        kubeconfig: null
    },
    clearInvalidConfig: true
});

module.exports = store;
