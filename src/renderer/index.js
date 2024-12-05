const { ipcRenderer } = require('electron');
const path = require('path');
const k8sClient = require(path.join(__dirname, 'services/k8s-client'));
const ResourceTree = require(path.join(__dirname, 'components/resource-tree'));
const ResourceDetails = require(path.join(__dirname, 'components/resource-details'));
const store = require(path.join(__dirname, '../utils/store'));

let resourceTree;
let resourceDetails;

// Handle config file loading
ipcRenderer.on('load-k8s-config', async (event, configPath) => {
    console.log('Received config file path:', configPath);
    try {
        await k8sClient.initialize(configPath);
        document.getElementById('config-path').textContent = `Config: ${configPath}`;
        
        // Refresh the resource tree if it exists
        if (resourceTree) {
            await resourceTree.refresh();
        }
    } catch (error) {
        console.error('Error loading kubernetes config:', error);
        document.getElementById('config-path').textContent = `Error loading config file: ${error.message}`;
        // Clear the stored config if it's invalid
        store.delete('kubeconfig');
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');
    resourceTree = new ResourceTree();
    resourceDetails = new ResourceDetails();

    // Try to load saved config
    const savedConfig = store.get('kubeconfig');
    if (savedConfig) {
        try {
            console.log('Loading saved config:', savedConfig);
            await k8sClient.initialize(savedConfig);
            document.getElementById('config-path').textContent = `Config: ${savedConfig}`;
            await resourceTree.refresh();
        } catch (error) {
            console.error('Error loading saved config:', error);
            document.getElementById('config-path').textContent = `Error loading saved config: ${error.message}`;
            store.delete('kubeconfig');
        }
    } else {
        document.getElementById('config-path').textContent = 'No config loaded. Use File > Load Kubernetes Config to get started.';
    }
});
