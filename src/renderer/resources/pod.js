class PodHandler {
    static getTableColumns() {
        return [
            { id: 'status', label: 'Status', width: '40px', sortable: false },
            { id: 'name', label: 'Name', sortable: true },
            { id: 'namespace', label: 'Namespace', sortable: true },
            { id: 'ready', label: 'Ready', sortable: true },
            { id: 'restarts', label: 'Restarts', sortable: true },
            { id: 'age', label: 'Age', sortable: true },
            { id: 'ip', label: 'IP', sortable: true },
            { id: 'node', label: 'Node', sortable: true }
        ];
    }

    static getStatusIcon(status) {
        // Return both icon and color class based on pod status
        switch (status.toLowerCase()) {
            case 'running':
                return {
                    icon: 'check_circle',
                    class: 'status-running',
                    tooltip: 'Running'
                };
            case 'pending':
                return {
                    icon: 'pending',
                    class: 'status-pending',
                    tooltip: 'Pending'
                };
            case 'succeeded':
                return {
                    icon: 'task_alt',
                    class: 'status-succeeded',
                    tooltip: 'Completed Successfully'
                };
            case 'failed':
                return {
                    icon: 'error',
                    class: 'status-failed',
                    tooltip: 'Failed'
                };
            case 'unknown':
            default:
                return {
                    icon: 'help',
                    class: 'status-unknown',
                    tooltip: 'Unknown Status'
                };
        }
    }

    static getContainerReadyCount(pod) {
        const containerStatuses = pod.status.containerStatuses || [];
        const readyCount = containerStatuses.filter(status => status.ready).length;
        const totalCount = containerStatuses.length;
        return {
            text: `${readyCount}/${totalCount}`,
            sortValue: readyCount / Math.max(totalCount, 1)  // For sorting
        };
    }

    static getRestartCount(pod) {
        const containerStatuses = pod.status.containerStatuses || [];
        return containerStatuses.reduce((total, status) => total + status.restartCount, 0);
    }

    static getAge(timestamp) {
        const created = new Date(timestamp);
        const now = new Date();
        const diffMs = now - created;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        let text;
        if (diffDays > 0) {
            text = `${diffDays}d`;
        } else {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours > 0) {
                text = `${diffHours}h`;
            } else {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                text = `${diffMinutes}m`;
            }
        }

        return {
            text,
            sortValue: created.getTime()  // For sorting
        };
    }

    static formatTableRow(pod) {
        const status = this.getStatusIcon(pod.status.phase);
        const ready = this.getContainerReadyCount(pod);
        const age = this.getAge(pod.metadata.creationTimestamp);

        return {
            status: {
                icon: status.icon,
                class: status.class,
                tooltip: status.tooltip,
                sortValue: pod.status.phase
            },
            name: pod.metadata.name,
            namespace: pod.metadata.namespace,
            ready: {
                text: ready.text,
                sortValue: ready.sortValue
            },
            restarts: this.getRestartCount(pod),
            age: {
                text: age.text,
                sortValue: age.sortValue
            },
            ip: pod.status.podIP || 'N/A',
            node: pod.spec.nodeName || 'N/A'
        };
    }

    static formatDetails(pod) {
        const containerDetails = (pod.status.containerStatuses || []).map(container => {
            return `
                <div class="container-status">
                    <h4>${container.name}</h4>
                    <table class="details-table">
                        <tr><td>Ready</td><td>${container.ready ? 'Yes' : 'No'}</td></tr>
                        <tr><td>Restart Count</td><td>${container.restartCount}</td></tr>
                        <tr><td>Image</td><td>${container.image}</td></tr>
                        <tr><td>Container ID</td><td>${container.containerID || 'N/A'}</td></tr>
                    </table>
                </div>
            `;
        }).join('');

        return `
            <div class="details-section">
                <h3>Pod Details</h3>
                <table class="details-table">
                    <tr><td>Name</td><td>${pod.metadata.name}</td></tr>
                    <tr><td>Namespace</td><td>${pod.metadata.namespace}</td></tr>
                    <tr><td>Node</td><td>${pod.spec.nodeName || 'N/A'}</td></tr>
                    <tr><td>Pod IP</td><td>${pod.status.podIP || 'N/A'}</td></tr>
                    <tr><td>Host IP</td><td>${pod.status.hostIP || 'N/A'}</td></tr>
                    <tr><td>QoS Class</td><td>${pod.status.qosClass || 'N/A'}</td></tr>
                    <tr><td>Phase</td><td>${pod.status.phase}</td></tr>
                    <tr><td>Created</td><td>${new Date(pod.metadata.creationTimestamp).toLocaleString()}</td></tr>
                </table>
            </div>

            <div class="details-section">
                <h3>Container Statuses</h3>
                ${containerDetails}
            </div>

            <div class="details-section">
                <h3>Labels</h3>
                <div class="json-view">${JSON.stringify(pod.metadata.labels || {}, null, 2)}</div>
            </div>

            <div class="details-section">
                <h3>Annotations</h3>
                <div class="json-view">${JSON.stringify(pod.metadata.annotations || {}, null, 2)}</div>
            </div>

            <div class="details-section">
                <h3>Events</h3>
                <div id="pod-events">Loading events...</div>
            </div>
        `;
    }
}

module.exports = PodHandler;
