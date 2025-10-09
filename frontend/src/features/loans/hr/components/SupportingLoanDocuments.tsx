import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@radix-ui/react-select';
import { Button } from '@/components/ui/button';
import { Paperclip, AlertCircle, FileText, Download } from 'lucide-react';

import type { LoanDocument } from '../../employee/types/loan';

export const SupportingLoanDocuments = ({
  documents,
  error = 'Failed to upload document',
}: {
  documents: LoanDocument[];
  error: string | null;
}) => {
  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center space-x-2'>
          <Paperclip className='text-primary h-5 w-5' />
          <CardTitle className='text-lg font-semibold'>
            Supporting Documents
          </CardTitle>
        </div>
        <CardDescription>
          Documents submitted by the employee to support their loan application.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Documents List */}
        {documents && documents?.length > 0 && (
          <div className='space-y-4'>
            <Separator />
            <div className='space-y-3'>
              <h4 className='text-foreground text-sm font-medium'>
                Uploaded Documents ({documents?.length})
              </h4>
              <div className='max-h-96 space-y-2 overflow-y-auto'>
                {documents?.map(doc => (
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {documents?.length === 0 && (
          <div className='py-6 text-center'>
            <FileText className='text-muted-foreground/50 mx-auto mb-3 h-12 w-12' />
            <p className='text-muted-foreground text-sm'>
              No documents uploaded yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
