class ResourceDetails {
    constructor() {
        this.detailsContainer = document.getElementById('resource-details');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('resource-selected', (event) => {
            this.displayResourceDetails(event.detail.resourceType, event.detail.item);
        });
    }

    displayResourceDetails(resourceType, item) {
        const metadata = item.metadata;
        const spec = item.spec;
        const status = item.status;

        let html = `
            <h2>${resourceType}: ${metadata.name}</h2>
            <div class="details-section">
                <h3>Metadata</h3>
                <table class="details-table">
                    <tr><td>Namespace:</td><td>${metadata.namespace || 'N/A'}</td></tr>
                    <tr><td>Created:</td><td>${new Date(metadata.creationTimestamp).toLocaleString()}</td></tr>
                    <tr><td>UID:</td><td>${metadata.uid}</td></tr>
                </table>
            </div>
        `;

        if (spec) {
            html += `
                <div class="details-section">
                    <h3>Specification</h3>
                    <pre class="json-view">${JSON.stringify(spec, null, 2)}</pre>
                </div>
            `;
        }

        if (status) {
            html += `
                <div class="details-section">
                    <h3>Status</h3>
                    <pre class="json-view">${JSON.stringify(status, null, 2)}</pre>
                </div>
            `;
        }

        this.detailsContainer.innerHTML = html;
    }

    clear() {
        this.detailsContainer.innerHTML = 'Select a resource to view details';
    }
}

module.exports = ResourceDetails;
