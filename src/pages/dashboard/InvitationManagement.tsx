import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, Printer, Users, Clock, MailOpen, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountrySelect } from '@/components/ui/country-select';
import en from 'react-phone-number-input/locale/en';
import { useGetApprovedApplicationsQuery, FILE_BASE_URL } from '@/store/services/api';

export function InvitationManagement() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedJournalists, setSelectedJournalists] = useState<number[]>([]);
    const [page, setPage] = useState(1);

    const { data, isLoading } = useGetApprovedApplicationsQuery({ page, limit: 10 });

    const countryName = (code: string) => en[code as keyof typeof en] || code;

    const filteredData = (data?.applications || []).filter(app => {
        const fullname = app.user?.fullName?.toLowerCase() || '';
        const passport = app.formData?.passport_number?.toLowerCase() || '';
        return (fullname.includes(searchTerm.toLowerCase()) || passport.includes(searchTerm.toLowerCase())) &&
            (selectedCountry ? app.formData?.country === selectedCountry : true);
    });

    const handleSelectJournalist = (id: number) => {
        setSelectedJournalists(prev =>
            prev.includes(id) ? prev.filter(jId => jId !== id) : [...prev, id]
        );
    };

    const handleGenerate = (applicationId: number) => {
        // Invitations generate PDF on the backend
        const url = `${FILE_BASE_URL}/api/v1/invitations/generate/${applicationId}`;
        window.open(url, '_blank');
    };

    const handleGenerateSelected = () => {
        selectedJournalists.forEach(id => handleGenerate(id));
    };

    if (isLoading) return <div className="p-8 text-center text-blue-600 font-bold">Loading approved delegates...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Invitation Letters</h2>
                    <p className="text-muted-foreground">Manage and generate official invitation letters for approved personnel.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg" onClick={handleGenerateSelected} disabled={selectedJournalists.length === 0}>
                    <Mail className="h-4 w-4" />
                    Generate Selected ({selectedJournalists.length})
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Approved Personnel</p>
                            <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Awaiting Letter</p>
                            <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <MailOpen className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Letters Ready</p>
                            <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Section */}
            <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        placeholder="Search by Name, Passport...."
                                        className="w-full pl-9 pr-4 h-11 rounded-md border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500">Country</label>
                                <CountrySelect
                                    value={selectedCountry}
                                    onChange={setSelectedCountry}
                                    placeholder="All countries"
                                />
                            </div>
                        </div>
                        <Button variant="outline" className="h-11 px-6 gap-2 bg-gray-50 border-gray-200 text-gray-700 font-bold hover:bg-gray-100">
                            Apply Filter <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-12 w-12 px-4 text-left align-middle font-medium">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedJournalists(filteredData.map(j => j.id));
                                            } else {
                                                setSelectedJournalists([]);
                                            }
                                        }}
                                        checked={selectedJournalists.length === filteredData.length && filteredData.length > 0}
                                    />
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">PERSONNEL</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">COUNTRY</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">PASSPORT NO</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ROLE</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">STATUS</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-gray-500 uppercase text-xs tracking-wider">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredData.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 align-middle">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedJournalists.includes(app.id)}
                                            onChange={() => handleSelectJournalist(app.id)}
                                        />
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="font-bold text-gray-900">{app.user?.fullName}</div>
                                        <div className="text-xs text-gray-500">{app.user?.email}</div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                                            {countryName(app.formData?.country || app.user?.country || 'ET')}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle font-mono font-bold text-blue-600">{app.formData?.passport_number}</td>
                                    <td className="p-4 align-middle">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                            {app.formData?.occupation || 'Delegate'}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 w-fit">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            APPROVED
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/dashboard/journalists/${app.id}`)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold gap-1.5" onClick={() => handleGenerate(app.id)}>
                                                Generate <Mail className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t flex items-center justify-end gap-2 bg-gray-50/30">
                    <span className="text-sm text-gray-500 mr-4">Page {page} of {data?.totalPages || 1}</span>
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-8 w-20">Previous</Button>
                    <Button variant="outline" size="sm" disabled={page === data?.totalPages} onClick={() => setPage(page + 1)} className="h-8 w-20">Next</Button>
                </div>
            </Card>
        </div>
    );
}
