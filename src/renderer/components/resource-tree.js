const path = require('path');
const k8sClient = require(path.join(__dirname, '../services/k8s-client'));
const k8sResources = require(path.join(__dirname, '../config/k8s-resources'));
const PodHandler = require(path.join(__dirname, '../resources/pod'));
const JobHandler = require(path.join(__dirname, '../resources/job'));
const CronJobHandler = require(path.join(__dirname, '../resources/cronjob'));

class ResourceTree {
    constructor() {
        this.currentResource = null;
        this.currentSort = {
            column: 'name',
            direction: 'asc'
        };
        this.setupEventListeners();
        this.setupResizeHandle();
    }

    setupEventListeners() {
        document.addEventListener('resource-selected', (event) => {
            this.showResourceDetails(event.detail.resourceType, event.detail.item);
        });

        const namespaceSelect = document.getElementById('namespace-select');
        namespaceSelect.addEventListener('change', () => {
            if (this.currentResource) {
                this.loadResourceList(this.currentResource);
            }
        });
    }

    setupResizeHandle() {
        const resizeHandle = document.getElementById('resize-handle');
        const resourceListPanel = document.getElementById('resource-list-panel');
        let startY, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            startY = e.clientY;
            startHeight = parseInt(getComputedStyle(resourceListPanel).height, 10);
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });

        function resize(e) {
            const diff = e.clientY - startY;
            resourceListPanel.style.height = `${startHeight + diff}px`;
        }

        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }

    async refresh() {
        console.log('Refreshing resource tree');
        const treeElement = document.getElementById('k8s-tree');
        treeElement.innerHTML = '';

        for (const [groupKey, group] of Object.entries(k8sResources)) {
            const groupElement = document.createElement('div');
            groupElement.className = 'resource-group';
            
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `<span class="group-icon">▶</span>${group.label}`;
            
            const content = document.createElement('div');
            content.className = 'group-content';

            group.resources.forEach(resource => {
                const resourceElement = document.createElement('div');
                resourceElement.className = 'resource-item';
                resourceElement.textContent = resource.name;
                resourceElement.addEventListener('click', () => this.loadResourceList(resource));
                content.appendChild(resourceElement);
            });

            header.addEventListener('click', () => {
                const icon = header.querySelector('.group-icon');
                if (content.classList.contains('expanded')) {
                    content.classList.remove('expanded');
                    icon.textContent = '▶';
                } else {
                    content.classList.add('expanded');
                    icon.textContent = '▼';
                }
            });

            groupElement.appendChild(header);
            groupElement.appendChild(content);
            treeElement.appendChild(groupElement);
        }
    }

    async loadResourceList(resource) {
        this.currentResource = resource;
        const tableBody = document.querySelector('#resource-table tbody');
        const tableHeader = document.querySelector('#resource-table thead tr');
        
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

        try {
            const data = await k8sClient.listResources(resource.api, resource.method);
            const selectedNamespace = document.getElementById('namespace-select').value;
            
            // Update namespace filter options
            this.updateNamespaceFilter(data.items);

            // Filter items by selected namespace
            const filteredItems = selectedNamespace === 'all' 
                ? data.items 
                : data.items.filter(item => item.metadata.namespace === selectedNamespace);

            // Update table headers based on resource type
            let columns;
            if (resource.name === 'Pods') {
                columns = PodHandler.getTableColumns();
            } else if (resource.name === 'Jobs') {
                columns = JobHandler.getTableColumns();
            } else if (resource.name === 'CronJobs') {
                columns = CronJobHandler.getTableColumns();
            } else {
                // Default columns for other resources
                columns = [
                    { id: 'name', label: 'Name', sortable: true },
                    { id: 'namespace', label: 'Namespace', sortable: true },
                    { id: 'age', label: 'Age', sortable: true }
                ];
            }

            // Set up table headers
            tableHeader.innerHTML = columns.map(col => {
                const sortableClass = col.sortable ? ' sortable' : '';
                const sortIndicator = col.sortable && this.currentSort.column === col.id
                    ? ` sort-${this.currentSort.direction}`
                    : '';
                return `<th class="${sortableClass}${sortIndicator}" data-column="${col.id}"${col.width ? ` style="width: ${col.width}"` : ''}>${col.label}</th>`;
            }).join('');

            // Add click handlers for sortable headers
            tableHeader.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => this.handleSort(th.dataset.column));
            });

            // Clear and populate the table
            tableBody.innerHTML = '';
            
            // Format and sort the items
            const formattedItems = filteredItems.map(item => {
                let formattedData;
                if (resource.name === 'Pods') {
                    formattedData = PodHandler.formatTableRow(item);
                } else if (resource.name === 'Jobs') {
                    formattedData = JobHandler.formatTableRow(item);
                } else if (resource.name === 'CronJobs') {
                    formattedData = CronJobHandler.formatTableRow(item);
                } else {
                    // Default formatting for other resources
                    formattedData = {
                        name: item.metadata.name,
                        namespace: item.metadata.namespace || 'N/A',
                        age: this.calculateAge(item.metadata.creationTimestamp)
                    };
                }
                return { item, formattedData };
            });

            this.sortItems(formattedItems);

            formattedItems.forEach(({ item, formattedData }) => {
                const row = document.createElement('tr');
                
                if (resource.name === 'Pods') {
                    row.innerHTML = `
                        <td><div class="status-icon ${formattedData.status.class}" data-tooltip="${formattedData.status.tooltip}">
                            <span class="material-icons">${formattedData.status.icon}</span>
                        </div></td>
                        <td>${formattedData.name}</td>
                        <td>${formattedData.namespace}</td>
                        <td>${formattedData.ready.text}</td>
                        <td>${formattedData.restarts}</td>
                        <td>${formattedData.age.text}</td>
                        <td>${formattedData.ip}</td>
                        <td>${formattedData.node}</td>
                    `;
                } else if (resource.name === 'Jobs') {
                    row.innerHTML = `
                        <td><div class="status-icon ${formattedData.status.class}" data-tooltip="${formattedData.status.tooltip}">
                            <span class="material-icons">${formattedData.status.icon}</span>
                        </div></td>
                        <td>${formattedData.name}</td>
                        <td>${formattedData.namespace}</td>
                        <td>${formattedData.completions.text}</td>
                        <td>${formattedData.duration.text}</td>
                        <td>${formattedData.age.text}</td>
                    `;
                } else if (resource.name === 'CronJobs') {
                    row.innerHTML = `
                        <td><div class="status-icon ${formattedData.status.class}" data-tooltip="${formattedData.status.tooltip}">
                            <span class="material-icons">${formattedData.status.icon}</span>
                        </div></td>
                        <td>${formattedData.name}</td>
                        <td>${formattedData.namespace}</td>
                        <td>${formattedData.schedule}</td>
                        <td>${formattedData.lastSchedule.text}</td>
                        <td>${formattedData.active.text}</td>
                        <td>${formattedData.age.text}</td>
                    `;
                } else {
                    // Default row format for other resources
                    row.innerHTML = `
                        <td>${formattedData.name}</td>
                        <td>${formattedData.namespace}</td>
                        <td>${formattedData.age.text}</td>
                    `;
                }

                row.addEventListener('click', () => {
                    tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
                    row.classList.add('selected');
                    this.showResourceDetails(resource.name, item);
                });
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading resources:', error);
            tableBody.innerHTML = `<tr><td colspan="8">Error loading resources: ${error.message}</td></tr>`;
        }
    }

    handleSort(column) {
        if (this.currentSort.column === column) {
            // Toggle direction if clicking the same column
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Set new column and default to ascending
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        // Reload the resource list to apply new sorting
        this.loadResourceList(this.currentResource);
    }

    sortItems(items) {
        items.sort((a, b) => {
            const aValue = this.getSortValue(a.formattedData[this.currentSort.column]);
            const bValue = this.getSortValue(b.formattedData[this.currentSort.column]);
            
            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;
            
            return this.currentSort.direction === 'asc' ? comparison : -comparison;
        });
    }

    getSortValue(field) {
        if (field && typeof field === 'object' && 'sortValue' in field) {
            return field.sortValue;
        }
        return field;
    }

    updateNamespaceFilter(items) {
        const namespaceSelect = document.getElementById('namespace-select');
        const currentValue = namespaceSelect.value;
        const namespaces = new Set(['all']);
        
        items.forEach(item => {
            if (item.metadata.namespace) {
                namespaces.add(item.metadata.namespace);
            }
        });

        namespaceSelect.innerHTML = '';
        Array.from(namespaces).sort().forEach(namespace => {
            const option = document.createElement('option');
            option.value = namespace;
            option.textContent = namespace === 'all' ? 'All Namespaces' : namespace;
            namespaceSelect.appendChild(option);
        });

        namespaceSelect.value = currentValue;
    }

    showResourceDetails(resourceType, item) {
        const detailsElement = document.getElementById('resource-details');
        
        if (resourceType === 'Pods') {
            detailsElement.innerHTML = PodHandler.formatDetails(item);
        } else if (resourceType === 'Jobs') {
            detailsElement.innerHTML = JobHandler.formatDetails(item);
        } else if (resourceType === 'CronJobs') {
            detailsElement.innerHTML = CronJobHandler.formatDetails(item);
        } else {
            // Default details view for other resource types
            detailsElement.innerHTML = `
                <div class="details-section">
                    <h3>Metadata</h3>
                    <table class="details-table">
                        <tr><td>Name</td><td>${item.metadata.name}</td></tr>
                        <tr><td>Namespace</td><td>${item.metadata.namespace || 'N/A'}</td></tr>
                        <tr><td>Created</td><td>${new Date(item.metadata.creationTimestamp).toLocaleString()}</td></tr>
                        <tr><td>UID</td><td>${item.metadata.uid}</td></tr>
                    </table>
                </div>
                
                <div class="details-section">
                    <h3>Spec</h3>
                    <div class="json-view">${JSON.stringify(item.spec, null, 2)}</div>
                </div>
                
                <div class="details-section">
                    <h3>Status</h3>
                    <div class="json-view">${JSON.stringify(item.status, null, 2)}</div>
                </div>
            `;
        }
    }

    calculateAge(timestamp) {
        const now = new Date();
        const creationDate = new Date(timestamp);
        const age = now - creationDate;
        const seconds = Math.floor(age / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    }
}

module.exports = ResourceTree;
