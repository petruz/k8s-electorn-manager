// Resource definitions for Kubernetes objects
const k8sResources = {
    workloads: {
        label: 'Workloads',
        resources: [
            { name: 'Pods', api: 'core', method: 'listNamespacedPod' },
            { name: 'Deployments', api: 'apps', method: 'listNamespacedDeployment' },
            { name: 'StatefulSets', api: 'apps', method: 'listNamespacedStatefulSet' },
            { name: 'DaemonSets', api: 'apps', method: 'listNamespacedDaemonSet' }
        ]
    },
    batch: {
        label: 'Batch',
        resources: [
            { name: 'Jobs', api: 'batch', method: 'listNamespacedJob' },
            { name: 'CronJobs', api: 'batch', method: 'listNamespacedCronJob' }
        ]
    },
    storage: {
        label: 'Storage',
        resources: [
            { name: 'PersistentVolumes', api: 'core', method: 'listPersistentVolume' },
            { name: 'PersistentVolumeClaims', api: 'core', method: 'listNamespacedPersistentVolumeClaim' },
            { name: 'StorageClasses', api: 'storage', method: 'listStorageClass' }
        ]
    },
    networking: {
        label: 'Networking',
        resources: [
            { name: 'Services', api: 'core', method: 'listNamespacedService' },
            { name: 'Ingresses', api: 'networking', method: 'listNamespacedIngress' },
            { name: 'NetworkPolicies', api: 'networking', method: 'listNamespacedNetworkPolicy' }
        ]
    },
    config: {
        label: 'Config and Storage',
        resources: [
            { name: 'ConfigMaps', api: 'core', method: 'listNamespacedConfigMap' },
            { name: 'Secrets', api: 'core', method: 'listNamespacedSecret' }
        ]
    }
};

module.exports = k8sResources;
