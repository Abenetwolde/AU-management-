import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, FileText, ChevronLeft } from "lucide-react";
import { DesignGallery } from './components/DesignGallery';
import { ConfigList } from './components/ConfigList';
import { LetterEditor } from './components/LetterEditor';
import { LetterConfig } from '@/store/services/api';
import { Button } from '@/components/ui/button';

export const InvitationCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState("designs");
    const [view, setView] = useState<"list" | "editor">("list");
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<LetterConfig | null>(null);

    const handleSelectTemplate = (id: number) => {
        setSelectedTemplateId(id);
        setSelectedConfig(null);
        setView("editor");
    };

    const handleEditConfig = (config: LetterConfig) => {
        setSelectedConfig(config);
        setSelectedTemplateId(config.templateId);
        setView("editor");
    };

    const handleBackToList = () => {
        setView("list");
        setSelectedTemplateId(null);
        setSelectedConfig(null);
    };

    if (view === "editor") {
        return (
            <div className="space-y-6 w-full">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handleBackToList} className="rounded-full h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            {selectedConfig ? `Edit: ${selectedConfig.name}` : "Configure Design"}
                        </h1>
                        <p className="text-xs text-gray-500">Customize the letter content and placeholders.</p>
                    </div>
                </div>

                <LetterEditor
                    templateId={selectedTemplateId}
                    existingConfig={selectedConfig}
                    onSaved={handleBackToList}
                    onCancel={handleBackToList}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invitation Center</h1>
                <p className="text-gray-500">Design and customize personalized invitation letters.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl h-auto">
                    <TabsTrigger value="designs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <Palette className="h-4 w-4 mr-2" /> Designs
                    </TabsTrigger>
                    <TabsTrigger value="configs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5">
                        <FileText className="h-4 w-4 mr-2" /> Saved Configs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="designs">
                    <DesignGallery onSelect={handleSelectTemplate} />
                </TabsContent>

                <TabsContent value="configs">
                    <ConfigList
                        onEdit={handleEditConfig}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};
