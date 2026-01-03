import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

export interface ExportColumn {
    header: string;
    key: string;
}

export interface ExportData {
    [key: string]: any;
}

const generateFilename = (baseName: string, extension: string): string => {
    const date = new Date().toISOString().split('T')[0];
    return `${baseName}_${date}.${extension}`;
};

/**
 * Export data to CSV file
 */
export function exportToCSV(data: ExportData[], baseFilename: string = 'export') {
    const filename = generateFilename(baseFilename, 'csv');
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if ((navigator as any).msSaveBlob) { // IE 10+
        (navigator as any).msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
    }
}

/**
 * Export data to PDF file with table
 */
export function exportToPDF(
    data: ExportData[],
    columns: ExportColumn[],
    baseFilename: string = 'export',
    title: string = 'Export Data'
) {
    const filename = generateFilename(baseFilename, 'pdf');
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    // Prepare table data
    const tableData = data.map(row =>
        columns.map(col => {
            const val = row[col.key];
            return val !== null && val !== undefined ? String(val) : '';
        })
    );

    // Add table
    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: tableData,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 155, 77] }, // Green color
    });

    doc.save(filename);
}

/**
 * Export journalist list to CSV
 */
export function exportJournalistsToCSV(journalists: any[]) {
    const data = journalists.map(j => ({
        'Full Name': j.user?.fullName || j.fullname || 'N/A',
        'Email': j.user?.email || j.email || 'N/A',
        'Phone': j.formData?.phone || 'N/A',
        'Country': j.formData?.country || j.country || 'N/A',
        'Passport No': j.formData?.passport_number || j.passportNo || 'N/A',
        'Occupation': j.formData?.occupation || j.role || 'N/A',
        'Arrival Date': j.formData?.arrival_date || 'N/A',
        'Accommodation': j.formData?.accommodation_details || 'N/A',
        'EMA Status': j.status || 'N/A',
        'Immigration Status': j.immigrationStatus || 'N/A',
        'Customs Status': j.equipmentStatus || 'N/A',
        'Submission Date': j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'N/A'
    }));

    exportToCSV(data, 'journalists_list');
}

/**
 * Export journalist list to PDF
 */
export function exportJournalistsToPDF(journalists: any[]) {
    const columns: ExportColumn[] = [
        { header: 'Full Name', key: 'fullname' },
        { header: 'Email', key: 'email' },
        { header: 'Country', key: 'country' },
        { header: 'Passport No', key: 'passportNo' },
        { header: 'Occupation', key: 'role' },
        { header: 'Arrival', key: 'arrival' },
        { header: 'Status', key: 'status' }
    ];

    const data = journalists.map(j => ({
        fullname: j.user?.fullName || j.fullname || 'N/A',
        email: j.user?.email || j.email || 'N/A',
        country: j.formData?.country || j.country || 'N/A',
        passportNo: j.formData?.passport_number || j.passportNo || 'N/A',
        role: j.formData?.occupation || j.role || 'N/A',
        arrival: j.formData?.arrival_date || 'N/A',
        status: j.status || 'N/A'
    }));

    const filename = generateFilename('journalists_list', 'pdf');
    const doc = new jsPDF('landscape'); // Use landscape for more columns

    doc.setFontSize(16);
    doc.text('Journalist List', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => String((row as any)[col.key] || ''))),
        startY: 28,
        styles: { fontSize: 7 }, // Smaller font to fit
        headStyles: { fillColor: [0, 155, 77] },
    });

    doc.save(filename);
}

/**
 * Export Dashboard Analytics to CSV
 */
export function exportDashboardAnalyticsToCSV(title: string, kpis: any, charts: any) {
    const csvRows = [];
    csvRows.push([title]);
    csvRows.push([`Generated: ${new Date().toLocaleString()}`]);
    csvRows.push([]);

    // KPIs
    csvRows.push(['KEY METRICS']);
    csvRows.push(['Metric', 'Value', 'Relative %']);
    Object.values(kpis).forEach((kpi: any) => {
        csvRows.push([kpi.label, kpi.value, `${kpi.percentage || 0}%`]);
    });
    csvRows.push([]);

    // Chart Data - Time Series
    if (charts.timeSeries) {
        csvRows.push(['APPLICATION TRENDS (TIME SERIES)']);
        csvRows.push(['Date', 'Count']);
        charts.timeSeries.forEach((item: any) => {
            csvRows.push([item.date, item.count]);
        });
        csvRows.push([]);
    }

    // Chart Data - Status
    if (charts.statusDistribution) {
        csvRows.push(['STATUS DISTRIBUTION']);
        csvRows.push(['Status', 'Count']);
        charts.statusDistribution.forEach((item: any) => {
            csvRows.push([item.status || item.name, item.count || item.value]);
        });
    }

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export Dashboard Analytics to PDF
 */
export function exportDashboardAnalyticsToPDF(title: string, kpis: any, charts: any) {
    const doc = new jsPDF();
    const filename = generateFilename(title.toLowerCase().replace(/\s+/g, '_'), 'pdf');

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 155, 77); // AU Green
    doc.text(title, 14, 15);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    let y = 35;

    // KPIs Table
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('Key Performance Indicators', 14, y);
    y += 5;

    const kpiData = Object.values(kpis).map((kpi: any) => [
        kpi.label,
        String(kpi.value),
        `${kpi.percentage || 0}%`,
        kpi.trend || 'N/A'
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value', 'Relative %', 'Trend']],
        body: kpiData,
        headStyles: { fillColor: [0, 155, 77] },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Status Table
    if (charts.statusDistribution) {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.text('Status Distribution', 14, y);
        y += 5;

        const statusData = charts.statusDistribution.map((item: any) => [
            item.status || item.name,
            String(item.count || item.value)
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Status', 'Count']],
            body: statusData,
            headStyles: { fillColor: [0, 155, 77] },
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Time Series Table
    if (charts.timeSeries) {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.text('Application Trends', 14, y);
        y += 5;

        const timeData = charts.timeSeries.map((item: any) => [
            item.date,
            String(item.count)
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Date', 'Applications']],
            body: timeData,
            headStyles: { fillColor: [0, 155, 77] },
        });
    }

    // Footer with Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    doc.save(filename);
}

/**
 * Export journalist detail to PDF
 */
export function exportJournalistDetailToPDF(journalist: any) {
    const doc = new jsPDF();
    const filename = generateFilename(`journalist_${journalist.id || 'profile'}`, 'pdf');

    // Title
    doc.setFontSize(18);
    doc.text('Journalist Profile', 14, 15);

    // Personal Information
    doc.setFontSize(14);
    doc.text('Personal Information', 14, 30);
    doc.setFontSize(10);
    let y = 38;

    // Helper to safely get data
    const getVal = (path: string, fallback = 'N/A') => {
        return path.split('.').reduce((obj, key) => obj?.[key], journalist) || fallback;
    };

    const personalInfo = [
        ['Full Name', journalist.user?.fullName || journalist.fullname],
        ['Nationality', getVal('formData.country', journalist.country)],
        ['Passport Number', getVal('formData.passport_number', journalist.passportNo)],
        ['Gender', getVal('formData.gender', 'N/A')],
        ['Date of Birth', getVal('formData.dob', 'N/A')],
        ['Contact', getVal('formData.phone', journalist.contact)],
        ['Email', journalist.user?.email || journalist.email],
    ];

    personalInfo.forEach(([label, value]) => {
        doc.text(`${label}:`, 14, y);
        doc.text(String(value || 'N/A'), 60, y);
        y += 7;
    });

    // Travel Info
    y += 5;
    doc.setFontSize(14);
    doc.text('Travel & Accreditation', 14, y);
    y += 8;
    doc.setFontSize(10);

    const travelInfo = [
        ['Role', getVal('formData.occupation', journalist.role)],
        ['Accommodation', getVal('formData.accommodation_details', 'N/A')],
        ['Arrival Date', getVal('formData.arrival_date', 'N/A')],
        ['Status', journalist.status],
    ];

    travelInfo.forEach(([label, value]) => {
        doc.text(`${label}:`, 14, y);
        doc.text(String(value || 'N/A'), 60, y);
        y += 7;
    });

    // Footer
    doc.setFontSize(8);
    doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.height - 10
    );

    doc.save(filename);
}
