const k8s = require('@kubernetes/client-node');
const fs = require('fs');

class K8sClient {
    constructor() {
        this.apis = null;
    }

    initialize(configPath) {
        console.log('Initializing K8s client with config:', configPath);
        
        // Check if config file exists
        if (!fs.existsSync(configPath)) {
            const error = new Error(`Config file not found: ${configPath}`);
            console.error(error);
            throw error;
        }

        try {
            const kc = new k8s.KubeConfig();
            kc.loadFromFile(configPath);
            
            // Initialize API clients
            this.apis = {
                core: kc.makeApiClient(k8s.CoreV1Api),
                apps: kc.makeApiClient(k8s.AppsV1Api),
                networking: kc.makeApiClient(k8s.NetworkingV1Api),
                storage: kc.makeApiClient(k8s.StorageV1Api),
                batch: kc.makeApiClient(k8s.BatchV1Api)
            };
            console.log('K8s client initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing K8s client:', error);
            this.apis = null;
            throw new Error(`Failed to initialize Kubernetes client: ${error.message}`);
        }
    }

    async listResources(apiType, method, namespace = '') {
        if (!this.apis) {
            throw new Error('Kubernetes client not initialized');
        }

        const api = this.apis[apiType];
        if (!api) {
            throw new Error(`API type ${apiType} not found`);
        }

        try {
            console.log(`Fetching resources using ${apiType}.${method}`);
            let response;

            // Check if the method is for listing namespaced resources
            if (method.startsWith('listNamespaced')) {
                // Get all namespaces first
                const namespacesResponse = await this.apis.core.listNamespace();
                const namespaces = namespacesResponse.body.items.map(ns => ns.metadata.name);
                
                // Fetch resources from all namespaces
                const promises = namespaces.map(ns => api[method](ns));
                const responses = await Promise.all(promises);
                
                // Combine all responses
                const allItems = responses.flatMap(resp => resp.body.items);
                return { items: allItems };
            } else {
                response = await api[method]();
                return response.body;
            }
        } catch (error) {
            console.error(`Error fetching resources from ${apiType}.${method}:`, error);
            throw error;
        }
    }

    getApis() {
        return this.apis;
    }

    isInitialized() {
        return !!this.apis;
    }
}

// Export singleton instance
module.exports = new K8sClient();
