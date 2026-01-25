'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CSVDropzone } from './components/csv-dropzone';
import { CSVPreview } from './components/csv-preview';
import { ImportConfirmation } from './components/import-confirmation';
import { parseCSV, importExpenses, ParsedCSVData } from '@/lib/actions/import';
import { Button } from '@/components/ui/button';

export default function ImportPage() {
  const router = useRouter();
  const [csvData, setCsvData] = useState<ParsedCSVData | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = async (file: File, content: string) => {
    try {
      const parsed = await parseCSV(content);
      setCsvData(parsed);
      setFileContent(content);
      toast.success(`Parsed ${parsed.totalRows} transactions`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error(error);
    }
  };

  const handleImportClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmImport = async (month: number, year: number) => {
    setIsImporting(true);
    try {
      const result = await importExpenses(fileContent, month, year);

      if (result.success) {
        toast.success(`Successfully imported ${result.count} expenses`);
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Failed to import expenses');
      }
    } catch (error) {
      toast.error('An error occurred during import');
      console.error(error);
    } finally {
      setIsImporting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="container max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Import Expenses</h1>
        <p className="text-muted-foreground mt-2">
          Upload your credit card statement in CSV format
        </p>
      </div>

      <div className="space-y-6">
        <CSVDropzone onFileSelect={handleFileSelect} />

        {csvData && (
          <>
            <CSVPreview data={csvData} />

            <div className="flex justify-end">
              <Button onClick={handleImportClick} size="lg">
                Import {csvData.totalRows} Transactions
              </Button>
            </div>
          </>
        )}
      </div>

      {csvData && (
        <ImportConfirmation
          isOpen={showConfirmation}
          rowCount={csvData.totalRows}
          onConfirm={handleConfirmImport}
          onCancel={() => setShowConfirmation(false)}
          isImporting={isImporting}
        />
      )}
    </div>
  );
}
