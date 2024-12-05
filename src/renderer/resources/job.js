class JobHandler {
    static getTableColumns() {
        return [
            { id: 'status', label: 'Status', width: '40px', sortable: false },
            { id: 'name', label: 'Name', sortable: true },
            { id: 'namespace', label: 'Namespace', sortable: true },
            { id: 'completions', label: 'Completions', sortable: true },
            { id: 'duration', label: 'Duration', sortable: true },
            { id: 'age', label: 'Age', sortable: true }
        ];
    }

    static getStatusIcon(job) {
        if (job.status.succeeded > 0) {
            return {
                icon: 'task_alt',
                class: 'status-succeeded',
                tooltip: 'Completed Successfully'
            };
        } else if (job.status.failed > 0) {
            return {
                icon: 'error',
                class: 'status-failed',
                tooltip: 'Failed'
            };
        } else if (job.status.active > 0) {
            return {
                icon: 'play_circle',
                class: 'status-running',
                tooltip: 'Running'
            };
        } else {
            return {
                icon: 'help',
                class: 'status-unknown',
                tooltip: 'Unknown Status'
            };
        }
    }

    static getCompletions(job) {
        const desired = job.spec.completions || 1;
        const succeeded = job.status.succeeded || 0;
        return {
            text: `${succeeded}/${desired}`,
            sortValue: succeeded / desired
        };
    }

    static getDuration(job) {
        if (!job.status.startTime) return { text: 'Not started', sortValue: 0 };
        
        const start = new Date(job.status.startTime);
        const end = job.status.completionTime ? new Date(job.status.completionTime) : new Date();
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 60) {
            return { text: `${diffMins}m`, sortValue: diffMs };
        } else {
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;
            return { text: `${diffHours}h ${remainingMins}m`, sortValue: diffMs };
        }
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
            sortValue: created.getTime()
        };
    }

    static formatTableRow(job) {
        const status = this.getStatusIcon(job);
        const completions = this.getCompletions(job);
        const duration = this.getDuration(job);
        const age = this.getAge(job.metadata.creationTimestamp);

        return {
            status: {
                icon: status.icon,
                class: status.class,
                tooltip: status.tooltip,
                sortValue: status.tooltip
            },
            name: job.metadata.name,
            namespace: job.metadata.namespace,
            completions: completions,
            duration: duration,
            age: age
        };
    }

    static formatDetails(job) {
        return `
            <div class="details-section">
                <h3>Job Details</h3>
                <table class="details-table">
                    <tr><td>Name</td><td>${job.metadata.name}</td></tr>
                    <tr><td>Namespace</td><td>${job.metadata.namespace}</td></tr>
                    <tr><td>Created</td><td>${new Date(job.metadata.creationTimestamp).toLocaleString()}</td></tr>
                    <tr><td>Completions</td><td>${job.spec.completions || 1}</td></tr>
                    <tr><td>Parallelism</td><td>${job.spec.parallelism || 1}</td></tr>
                    <tr><td>Active</td><td>${job.status.active || 0}</td></tr>
                    <tr><td>Succeeded</td><td>${job.status.succeeded || 0}</td></tr>
                    <tr><td>Failed</td><td>${job.status.failed || 0}</td></tr>
                    ${job.status.startTime ? `<tr><td>Start Time</td><td>${new Date(job.status.startTime).toLocaleString()}</td></tr>` : ''}
                    ${job.status.completionTime ? `<tr><td>Completion Time</td><td>${new Date(job.status.completionTime).toLocaleString()}</td></tr>` : ''}
                </table>
            </div>

            <div class="details-section">
                <h3>Pod Template</h3>
                <div class="json-view">${JSON.stringify(job.spec.template, null, 2)}</div>
            </div>

            <div class="details-section">
                <h3>Labels</h3>
                <div class="json-view">${JSON.stringify(job.metadata.labels || {}, null, 2)}</div>
            </div>

            <div class="details-section">
                <h3>Events</h3>
                <div id="job-events">Loading events...</div>
            </div>
        `;
    }
}

module.exports = JobHandler;
