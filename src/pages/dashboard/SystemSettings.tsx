import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    useGetLandingPageSettingsQuery,
    useCreateLandingPageSettingsMutation,
    getFileUrl
} from '@/store/services/api';

interface Language {
    code: string;
    name: string;
    flagEmoji: string;
    enabled: boolean;
}

// Internal state structure matching form needs
interface SystemSettingsForm {
    heroMotto: string;
    description: string;
    privacyPolicyContent: string;
    deadlineEnabled: boolean;
    deadlineDate: string;
    contactEmail: string;
    contactLink: string;
    languages: Language[];
}

const DEFAULT_SETTINGS: SystemSettingsForm = {
    heroMotto: "Cover the Future of Africa",
    description: "Secure your official media accreditation for the African Union Summit.",
    privacyPolicyContent: "<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>",
    deadlineEnabled: true,
    deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contactEmail: "",
    contactLink: "",
    languages: [
        { code: 'en', name: 'English', flagEmoji: '�🇸', enabled: true },
        { code: 'fr', name: 'Français', flagEmoji: '🇫🇷', enabled: true },
    ]
};

export function SystemSettings() {
    // API Hooks
    const { data: apiSettings, isLoading } = useGetLandingPageSettingsQuery();
    const [createSettings, { isLoading: isSaving }] = useCreateLandingPageSettingsMutation();

    const [settings, setSettings] = useState<SystemSettingsForm>(DEFAULT_SETTINGS);
    const [showPreview, setShowPreview] = useState(false);
    const [newLang, setNewLang] = useState({ code: '', name: '', flagEmoji: '' });

    // File inputs
    const [mainLogo, setMainLogo] = useState<File | null>(null);
    const [footerLogo, setFooterLogo] = useState<File | null>(null);

    // Sync API data to local state
    useEffect(() => {
        if (apiSettings) {
            setSettings({
                heroMotto: apiSettings.heroMotto || DEFAULT_SETTINGS.heroMotto,
                description: apiSettings.description || DEFAULT_SETTINGS.description,
                privacyPolicyContent: apiSettings.privacyPolicyContent || DEFAULT_SETTINGS.privacyPolicyContent,
                deadlineEnabled: !!apiSettings.deadlineDate,
                deadlineDate: apiSettings.deadlineDate ? new Date(apiSettings.deadlineDate).toISOString().split('T')[0] : DEFAULT_SETTINGS.deadlineDate,
                contactEmail: apiSettings.contactEmail || "",
                contactLink: apiSettings.contactLink || "",
                languages: apiSettings.languages && apiSettings.languages.length > 0
                    ? apiSettings.languages.map(l => ({ ...l, enabled: true }))
                    : DEFAULT_SETTINGS.languages
            });
        }
    }, [apiSettings]);

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('heroMotto', settings.heroMotto);
        formData.append('description', settings.description);
        formData.append('privacyPolicyContent', settings.privacyPolicyContent);
        formData.append('contactEmail', settings.contactEmail);
        formData.append('contactLink', settings.contactLink);

        if (settings.deadlineEnabled && settings.deadlineDate) {
            formData.append('deadlineDate', new Date(settings.deadlineDate).toISOString());
        }

        // Filter enabled languages and map to API expected format
        const enabledLangs = settings.languages
            .filter(l => l.enabled)
            .map(({ enabled, ...rest }) => rest);
        formData.append('languages', JSON.stringify(enabledLangs));

        if (mainLogo) formData.append('mainLogo', mainLogo);
        if (footerLogo) formData.append('footerLogo', footerLogo);

        try {
            await createSettings(formData).unwrap();
            toast.success("Settings saved successfully");
            setMainLogo(null);
            setFooterLogo(null);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to save settings: " + (error?.data?.message || error.message));
        }
    };

    const toggleLanguage = (code: string) => {
        setSettings(prev => ({
            ...prev,
            languages: prev.languages.map(l => l.code === code ? { ...l, enabled: !l.enabled } : l)
        }));
    };

    const deleteLanguage = (code: string) => {
        setSettings(prev => ({
            ...prev,
            languages: prev.languages.filter(l => l.code !== code)
        }));
    };

    const addLanguage = () => {
        if (!newLang.code || !newLang.name || !newLang.flagEmoji) {
            toast.error("Please fill all language fields");
            return;
        }
        setSettings(prev => ({
            ...prev,
            languages: [...prev.languages, { ...newLang, enabled: true }]
        }));
        setNewLang({ code: '', name: '', flagEmoji: '' });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">Manage landing page content, localization, and policies.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Landing Page Configuration</CardTitle>
                        <CardDescription>Customize the main texts displayed on the home page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Hero Motto (Big Text)</Label>
                            <Input
                                value={settings.heroMotto}
                                onChange={(e) => setSettings({ ...settings, heroMotto: e.target.value })}
                                placeholder="e.g. Cover the Future of Africa"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={settings.description}
                                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                placeholder="Short description of the event..."
                                className="h-24"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input
                                    value={settings.contactEmail}
                                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                    placeholder="contact@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Link</Label>
                                <Input
                                    value={settings.contactLink}
                                    onChange={(e) => setSettings({ ...settings, contactLink: e.target.value })}
                                    placeholder="https://support.example.com"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Logo Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Branding & Logos</CardTitle>
                        <CardDescription>Upload organization logos for the header and documents.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Main Logo</Label>
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden"
                                    onClick={() => document.getElementById('mainLogoInput')?.click()}
                                >
                                    {mainLogo ? (
                                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                        </div>
                                    ) : apiSettings?.mainLogoUrl ? (
                                        <div className="h-16 w-16 relative">
                                            <img
                                                src={getFileUrl(apiSettings.mainLogoUrl)}
                                                alt="Main Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}

                                    <span className="text-sm text-gray-500 font-medium">
                                        {mainLogo ? mainLogo.name : (apiSettings?.mainLogoUrl ? 'Change Main Logo' : 'Upload Main Logo')}
                                    </span>
                                    {apiSettings?.mainLogoUrl && !mainLogo && <span className="text-xs text-green-600 font-bold">Current logo active</span>}
                                    <Input id="mainLogoInput" type="file" className="hidden" accept="image/*" onChange={(e) => setMainLogo(e.target.files?.[0] || null)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Footer Logo / Partner Logo</Label>
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden"
                                    onClick={() => document.getElementById('footerLogoInput')?.click()}
                                >
                                    {footerLogo ? (
                                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                        </div>
                                    ) : apiSettings?.footerLogoUrl ? (
                                        <div className="h-16 w-16 relative">
                                            <img
                                                src={getFileUrl(apiSettings.footerLogoUrl)}
                                                alt="Footer Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}

                                    <span className="text-sm text-gray-500 font-medium">
                                        {footerLogo ? footerLogo.name : (apiSettings?.footerLogoUrl ? 'Change Footer Logo' : 'Upload Footer Logo')}
                                    </span>
                                    {apiSettings?.footerLogoUrl && !footerLogo && <span className="text-xs text-green-600 font-bold">Current logo active</span>}
                                    <Input id="footerLogoInput" type="file" className="hidden" accept="image/*" onChange={(e) => setFooterLogo(e.target.files?.[0] || null)} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Registration Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Registration Control</CardTitle>
                        <CardDescription>Manage deadlines and registration availability.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border p-4 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base">Registration Deadline</Label>
                                <p className="text-sm text-muted-foreground">Enable to show countdown and block access after date.</p>
                            </div>
                            <Switch
                                checked={settings.deadlineEnabled}
                                onCheckedChange={(c) => setSettings({ ...settings, deadlineEnabled: c })}
                            />
                        </div>
                        {settings.deadlineEnabled && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Deadline Date</Label>
                                <Input
                                    type="date"
                                    value={settings.deadlineDate}
                                    onChange={(e) => setSettings({ ...settings, deadlineDate: e.target.value })}
                                    className="max-w-xs"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Language Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Localization</CardTitle>
                        <CardDescription>Manage available languages for the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {settings.languages.map((lang) => (
                                <div key={lang.code} className="flex items-center justify-between bg-secondary/20 p-3 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{lang.flagEmoji}</span>
                                        <div>
                                            <p className="font-medium">{lang.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{lang.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={lang.enabled}
                                            onCheckedChange={() => toggleLanguage(lang.code)}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => deleteLanguage(lang.code)} className="text-destructive hover:text-destructive/90">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="grid grid-cols-4 gap-2 items-end">
                            <div className="space-y-1">
                                <Label className="text-xs">Code</Label>
                                <Input value={newLang.code} onChange={e => setNewLang({ ...newLang, code: e.target.value })} placeholder="en" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Name</Label>
                                <Input value={newLang.name} onChange={e => setNewLang({ ...newLang, name: e.target.value })} placeholder="English" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Flag Emoji</Label>
                                <Input value={newLang.flagEmoji} onChange={e => setNewLang({ ...newLang, flagEmoji: e.target.value })} placeholder="🇺🇸" />
                            </div>
                            <Button onClick={addLanguage} variant="secondary" className="gap-2">
                                <Plus className="w-4 h-4" /> Add
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Policy */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Privacy Policy</CardTitle>
                                <CardDescription>Edit the HTML content for the privacy policy page.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                                {showPreview ? <><EyeOff className="w-4 h-4 mr-2" /> Editor</> : <><Eye className="w-4 h-4 mr-2" /> Preview</>}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {showPreview ? (
                            <div className="border rounded-md p-4 min-h-[300px] prose prose-sm max-w-none bg-white lg:prose-lg" dangerouslySetInnerHTML={{ __html: settings.privacyPolicyContent }} />
                        ) : (
                            <Textarea
                                value={settings.privacyPolicyContent}
                                onChange={(e) => setSettings({ ...settings, privacyPolicyContent: e.target.value })}
                                className="min-h-[300px] font-mono text-sm"
                                placeholder="<h1>Title</h1><p>Content...</p>"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
