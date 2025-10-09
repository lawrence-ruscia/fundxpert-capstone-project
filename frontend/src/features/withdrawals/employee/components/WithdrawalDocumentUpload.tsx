import { useWithdrawalDocs } from '../hooks/useLoanDocs';
import {
  AlertCircle,
  Download,
  FileText,
  Paperclip,
  Trash2,
  Upload,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@radix-ui/react-select';
import { toast } from 'sonner';

export const WithdrawalDocumentUpload = ({
  withdrawalId,
}: {
  withdrawalId: number;
}) => {
  const {
    documents,
    handleFileChange,
    handleFileDelete,
    loading,
    error,
    clearError,
  } = useWithdrawalDocs(withdrawalId);

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        // Create a synthetic event to reuse handleFileChange
        const syntheticEvent = {
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(syntheticEvent);
      }
    },
    [handleFileChange]
  );

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-muted-foreground flex items-center space-x-2'>
            <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2'></div>
            <span>Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    toast.error(error ?? 'Failed to upload file');
    clearError();
  }

  return (
    <Card className='w-full'>
      <CardHeader className='pb-4'>
        <div className='flex items-center space-x-2'>
          <Paperclip className='text-primary h-5 w-5' />
          <CardTitle className='text-lg font-semibold'>
            Supporting Documents
          </CardTitle>
        </div>
        <CardDescription>
          Upload required documents for your loan application. Accepted formats:
          PDF, JPEG, PNG (Max 10MB each)
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type='file'
            onChange={handleFileChange}
            className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
            accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
            disabled={loading}
          />
          <div className='flex flex-col items-center space-y-3'>
            <div className='bg-primary/10 rounded-full p-3'>
              <Upload className='text-primary h-6 w-6' />
            </div>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>
                Drop files here or click to browse
              </p>
              <p className='text-muted-foreground text-xs'>
                PDF, JPEG, PNG up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {documents.length > 0 && (
          <div className='space-y-4'>
            <Separator />
            <div className='space-y-3'>
              <h4 className='text-foreground text-sm font-medium'>
                Uploaded Documents ({documents.length})
              </h4>
              <div className='space-y-2'>
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className='bg-muted/30 flex items-center justify-between rounded-lg border p-3'
                  >
                    <div className='flex min-w-0 flex-1 items-center space-x-3'>
                      <div className='flex min-w-0 flex-1 items-center gap-3'>
                        <div className='bg-background border-border/50 rounded border p-2'>
                          <FileText className='text-muted-foreground h-4 w-4' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <a
                            className='truncate font-medium'
                            href={doc.file_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            title='Download document'
                          >
                            {doc.file_name}
                          </a>
                        </div>

                        <div className='hidden flex-shrink-0 items-center sm:flex'>
                          <p className='text-muted-foreground mr-1 text-xs whitespace-nowrap'>
                            {new Date(doc.uploaded_at).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center space-x-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        asChild
                        className='h-8 w-8 p-0'
                      >
                        <a
                          href={doc.file_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          title='Download document'
                        >
                          <Download className='h-4 w-4' />
                        </a>
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleFileDelete?.(
                            doc.file_name,
                            withdrawalId,
                            doc.id
                          )
                        }
                        disabled={loading}
                        className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0'
                        title='Delete document'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {documents.length === 0 && (
          <div className='py-6 text-center'>
            <FileText className='text-muted-foreground/50 mx-auto mb-3 h-12 w-12' />
            <p className='text-muted-foreground text-sm'>
              No documents uploaded yet
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Upload your first document to get started
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
