class CronJobHandler {
    static getTableColumns() {
        return [
            { id: 'status', label: 'Status', width: '40px', sortable: false },
            { id: 'name', label: 'Name', sortable: true },
            { id: 'namespace', label: 'Namespace', sortable: true },
            { id: 'schedule', label: 'Schedule', sortable: true },
            { id: 'lastSchedule', label: 'Last Schedule', sortable: true },
            { id: 'active', label: 'Active', sortable: true },
            { id: 'age', label: 'Age', sortable: true }
        ];
    }

    static getStatusIcon(cronjob) {
        if (cronjob.spec.suspend) {
            return {
                icon: 'pause_circle',
                class: 'status-suspended',
                tooltip: 'Suspended'
            };
        } else if (cronjob.status.active && cronjob.status.active.length > 0) {
            return {
                icon: 'play_circle',
                class: 'status-running',
                tooltip: 'Active Jobs Running'
            };
        } else if (cronjob.status.lastScheduleTime) {
            return {
                icon: 'schedule',
                class: 'status-scheduled',
                tooltip: 'Scheduled'
            };
        } else {
            return {
                icon: 'pending',
                class: 'status-pending',
                tooltip: 'Waiting for First Schedule'
            };
        }
    }

    static getLastSchedule(cronjob) {
        if (!cronjob.status.lastScheduleTime) {
            return {
                text: 'Never',
                sortValue: 0
            };
        }

        const lastSchedule = new Date(cronjob.status.lastScheduleTime);
        const now = new Date();
        const diffMs = now - lastSchedule;
        const diffMins = Math.floor(diffMs / (1000 * 60));

        let text;
        if (diffMins < 60) {
            text = `${diffMins}m ago`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) {
                text = `${diffHours}h ago`;
            } else {
                const diffDays = Math.floor(diffHours / 24);
                text = `${diffDays}d ago`;
            }
        }

        return {
            text,
            sortValue: lastSchedule.getTime()
        };
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

    static formatTableRow(cronjob) {
        const status = this.getStatusIcon(cronjob);
        const lastSchedule = this.getLastSchedule(cronjob);
        const age = this.getAge(cronjob.metadata.creationTimestamp);

        return {
            status: {
                icon: status.icon,
                class: status.class,
                tooltip: status.tooltip,
                sortValue: status.tooltip
            },
            name: cronjob.metadata.name,
            namespace: cronjob.metadata.namespace,
            schedule: cronjob.spec.schedule,
            lastSchedule: lastSchedule,
            active: {
                text: (cronjob.status.active || []).length.toString(),
                sortValue: (cronjob.status.active || []).length
            },
            age: age
        };
    }

    static formatDetails(cronjob) {
        const activeJobs = (cronjob.status.active || []).map(ref => {
            return `<li>${ref.name}</li>`;
        }).join('');

        return `
            <div class="details-section">
                <h3>CronJob Details</h3>
                <table class="details-table">
                    <tr><td>Name</td><td>${cronjob.metadata.name}</td></tr>
                    <tr><td>Namespace</td><td>${cronjob.metadata.namespace}</td></tr>
                    <tr><td>Schedule</td><td>${cronjob.spec.schedule}</td></tr>
                    <tr><td>Suspended</td><td>${cronjob.spec.suspend ? 'Yes' : 'No'}</td></tr>
                    <tr><td>Concurrency Policy</td><td>${cronjob.spec.concurrencyPolicy || 'Allow'}</td></tr>
                    <tr><td>Last Schedule</td><td>${cronjob.status.lastScheduleTime ? new Date(cronjob.status.lastScheduleTime).toLocaleString() : 'Never'}</td></tr>
                    <tr><td>Created</td><td>${new Date(cronjob.metadata.creationTimestamp).toLocaleString()}</td></tr>
                </table>
            </div>

            ${activeJobs ? `
            <div class="details-section">
                <h3>Active Jobs</h3>
                <ul class="active-jobs-list">
                    ${activeJobs}
                </ul>
            </div>
            ` : ''}

            <div class="details-section">
                <h3>Job Template</h3>
                <div class="json-view">${JSON.stringify(cronjob.spec.jobTemplate, null, 2)}</div>
            </div>

            <div class="details-section">
                <h3>Labels</h3>
                <div class="json-view">${JSON.stringify(cronjob.metadata.labels || {}, null, 2)}</div>
            </div>

            <div class="details-section">
                <h3>Events</h3>
                <div id="cronjob-events">Loading events...</div>
            </div>
        `;
    }
}

module.exports = CronJobHandler;
