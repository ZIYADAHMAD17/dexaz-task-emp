import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImportButtonProps {
    onImport: (data: any[]) => Promise<void>;
    template?: any[];
    fileName?: string;
    label?: string;
    className?: string;
}

export const ImportButton: React.FC<ImportButtonProps> = ({
    onImport,
    template,
    fileName = "template.xlsx",
    label = "Import",
    className
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast({
                        title: "Empty file",
                        description: "The uploaded file contains no data.",
                        variant: "destructive"
                    });
                    return;
                }

                await onImport(data);

                toast({
                    title: "Import Successful",
                    description: `${data.length} records processed successfully.`,
                });

                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (error: any) {
                toast({
                    title: "Import Failed",
                    description: error.message || "An error occurred during import.",
                    variant: "destructive"
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        if (!template) return;
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="flex gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
            />
            <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className={className}
            >
                <Upload className="h-4 w-4 mr-2" />
                {label}
            </Button>
            {template && (
                <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-xs text-muted-foreground">
                    Download Template
                </Button>
            )}
        </div>
    );
};
