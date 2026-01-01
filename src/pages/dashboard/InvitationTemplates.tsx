import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Check,
    Eye,
    Palette,
    FileText,
    Printer,
    Settings2,
    Layout,
    Code,
    Save,
    Trash2,
    X,
    Mail,
} from 'lucide-react';
import {
    useGetInvitationTemplatesQuery,
    useUpdateInvitationTemplateMutation,
    useDeleteInvitationTemplateMutation,
    useCreateInvitationTemplateMutation,
    InvitationTemplate,
    CreateInvitationTemplatePayload,
} from '@/store/services/api';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Helper to replace template variables for preview
const interpolateTemplate = (content: string, variables: Record<string, string>) => {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
    });
    return result;
};

const MOCK_VARS = {
    userName: "JOHN DOE",
    organization: "AFRICAN UNION",
    eventTitle: "38th AU Summit",
    eventDate: "Feb 15-16, 2025",
    venue: "Addis Ababa, Ethiopia",
    referenceNumber: "INV-2025-0812",
};

export function InvitationTemplates() {
    const { data: templates, isLoading } = useGetInvitationTemplatesQuery();
    const [updateTemplate] = useUpdateInvitationTemplateMutation();
    const [createTemplate] = useCreateInvitationTemplateMutation();
    const [deleteTemplate] = useDeleteInvitationTemplateMutation();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState<Partial<CreateInvitationTemplatePayload>>({
        name: '',
        description: '',
        htmlContent: `<div style="padding: 40px; font-family: sans-serif; line-height: 1.6;">
    <h1 style="text-align: center; color: #007a3d;">OFFICIAL INVITATION</h1>
    <div style="margin-top: 40px;">
        <p>Dear <strong>{{userName}}</strong>,</p>
        <p>On behalf of the <strong>{{organization}}</strong>, we are pleased to invite you to the <strong>{{eventTitle}}</strong>.</p>
        <p>This event will take place on {{eventDate}} at {{venue}}.</p>
        <div style="margin-top: 40px; padding: 20px; background: #f9f9f9; border-left: 4px solid #007a3d;">
            <p><strong>Reference Number:</strong> {{referenceNumber}}</p>
        </div>
        <p style="margin-top: 40px;">Sincerely,</p>
        <div style="margin-top: 20px; font-weight: bold;">EMA Accreditation Team</div>
    </div>
</div>`,
        cssStyles: `body { background-color: white; }`,
        dynamicVariables: ['userName', 'eventTitle', 'organization', 'referenceNumber', 'eventDate', 'venue'],
    });

    // Local state for editing cards
    const [editStates, setEditStates] = useState<Record<number, { isCode: boolean; html: string; css: string }>>({});

    const handleToggleMode = (id: number, currentHtml: string, currentCss: string) => {
        setEditStates(prev => {
            const current = prev[id] || { isCode: false, html: currentHtml, css: currentCss };
            return {
                ...prev,
                [id]: { ...current, isCode: !current.isCode }
            };
        });
    };

    const handleSave = async (id: number) => {
        const state = editStates[id];
        if (!state) return;
        try {
            await updateTemplate({
                id,
                data: {
                    htmlContent: state.html,
                    cssStyles: state.css,
                }
            }).unwrap();
            toast.success("Template updated");
        } catch (err) {
            toast.error("Failed to save template");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await deleteTemplate(id).unwrap();
            toast.success("Template deleted");
        } catch (err) {
            toast.error("Failed to delete template");
        }
    };

    const handleCreate = async () => {
        try {
            await createTemplate(newTemplate as CreateInvitationTemplatePayload).unwrap();
            toast.success("Invitation template created");
            setIsAddOpen(false);
        } catch (err) {
            toast.error("Failed to create template");
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-64">Loading templates...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Invitation Templates</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage official invitation letters for approved applicants</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-md">
                                <Plus className="h-4 w-4" />
                                New Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Invitation Template</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Template Name</Label>
                                    <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. AU Summit Official Letter" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>HTML Content</Label>
                                    <Textarea className="font-mono h-32" value={newTemplate.htmlContent} onChange={e => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>CSS Styles</Label>
                                    <Textarea className="font-mono h-32" value={newTemplate.cssStyles} onChange={e => setNewTemplate({ ...newTemplate, cssStyles: e.target.value })} />
                                </div>
                                <Button onClick={handleCreate} className="w-full bg-blue-600">Create Template</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-8">
                {templates?.map((template) => {
                    const localState = editStates[template.id] || { isCode: false, html: template.htmlContent, css: template.cssStyles };

                    return (
                        <div key={template.id} className="space-y-4">
                            <Card className={cn(
                                "relative overflow-hidden transition-all duration-500 border-0 shadow-xl bg-white",
                                template.isDefault ? "ring-2 ring-blue-500" : ""
                            )}>
                                <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{template.name}</h3>
                                        <p className="text-[10px] text-gray-500">{template.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center space-x-2 mr-2">
                                            <Label htmlFor={`mode-${template.id}`} className="text-[10px] font-bold uppercase text-gray-400">
                                                {localState.isCode ? 'Code' : 'Preview'}
                                            </Label>
                                            <Switch
                                                id={`mode-${template.id}`}
                                                checked={localState.isCode}
                                                onCheckedChange={() => handleToggleMode(template.id, template.htmlContent, template.cssStyles)}
                                            />
                                        </div>
                                        {localState.isCode && (
                                            <Button size="icon" variant="ghost" onClick={() => handleSave(template.id)} className="h-8 w-8 text-blue-600 hover:text-blue-700">
                                                <Save className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)} className="h-8 w-8 text-red-500 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CardContent className="p-0">
                                    {localState.isCode ? (
                                        <div className="flex flex-col h-[600px]">
                                            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-900 text-white">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] text-slate-400 font-mono">HTML</Label>
                                                        <Code className="h-3 w-3 text-slate-500" />
                                                    </div>
                                                    <Textarea
                                                        className="font-mono text-xs bg-slate-800 border-slate-700 h-64 focus:ring-blue-500"
                                                        value={localState.html}
                                                        onChange={e => setEditStates(prev => ({ ...prev, [template.id]: { ...(prev[template.id] || localState), html: e.target.value } }))}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] text-slate-400 font-mono">CSS</Label>
                                                        <Palette className="h-3 w-3 text-slate-500" />
                                                    </div>
                                                    <Textarea
                                                        className="font-mono text-xs bg-slate-800 border-slate-700 h-64 focus:ring-blue-500"
                                                        value={localState.css}
                                                        onChange={e => setEditStates(prev => ({ ...prev, [template.id]: { ...(prev[template.id] || localState), css: e.target.value } }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-start bg-slate-200/50 p-8 h-[600px] overflow-auto">
                                            <div
                                                className="shadow-2xl bg-white origin-top p-[1in]"
                                                style={{
                                                    transform: `scale(0.6)`,
                                                    width: `8.5in`,
                                                    height: `11in`,
                                                    flexShrink: 0
                                                }}
                                            >
                                                <style dangerouslySetInnerHTML={{ __html: localState.css }} />
                                                <div
                                                    className="invitation-preview-content h-full w-full overflow-hidden"
                                                    dangerouslySetInnerHTML={{
                                                        __html: interpolateTemplate(localState.html, MOCK_VARS)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                {template.isDefault && (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg shadow-sm">
                                        DEFAULT
                                    </div>
                                )}
                            </Card>

                            {!template.isDefault && (
                                <Button
                                    onClick={() => updateTemplate({ id: template.id, data: { isDefault: true } })}
                                    variant="outline"
                                    className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-gray-200"
                                >
                                    Set as Default Invitation
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
                {[
                    { label: 'Document Type', value: 'PDF / A4', icon: FileText },
                    { label: 'Active Letter', value: templates?.find(t => t.isDefault)?.name || 'None', icon: Mail },
                    { label: 'Dynamic Fields', value: '6 Supported', icon: Palette },
                    { label: 'Security', value: 'Watermarked', icon: Settings2 }
                ].map((stat, i) => (
                    <Card key={i} className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-sm font-bold text-gray-900 line-clamp-1">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
