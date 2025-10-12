import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  ArrowLeft,
  Shield,
  User,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  ChevronsUpDown,
  Check,
  Building,
  Briefcase,
  Hash,
  Plus,
  Save,
} from 'lucide-react';
import { assignLoanApprovers, getLoanById } from '../services/hrLoanService';
import { useSearchHR } from '../hooks/useSearchHR';
import type { Loan } from '../../employee/types/loan';
import { LoanStatusBadge } from '../../employee/components/LoanStatusBadge';

interface SearchHRRecord {
  id: number;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  email: string;
}

// Schema for individual approver
const approverSchema = z.object({
  approver_id: z.number().min(1, 'Approver ID is required'),
  sequence_order: z.number().min(1, 'Sequence must be at least 1'),
  approver_name: z.string(),
  approver_employee_id: z.string(),
  approver_department: z.string(),
  approver_position: z.string(),
});

// Schema for the entire form
const assignApproversSchema = z.object({
  approvers: z
    .array(approverSchema)
    .min(1, 'At least one approver is required')
    .refine(
      approvers => {
        const ids = approvers.map(a => a.approver_id);
        return new Set(ids).size === ids.length;
      },
      { message: 'Each approver can only be assigned once' }
    ),
});

type AssignApproversFormData = z.infer<typeof assignApproversSchema>;

export const LoanReviewPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHR, setSelectedHR] = useState<SearchHRRecord | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);

  const { loanId } = useParams();
  const navigate = useNavigate();

  const { results, clearResults } = useSearchHR(searchQuery, setSearchError);

  const form = useForm<AssignApproversFormData>({
    resolver: zodResolver(assignApproversSchema),
    defaultValues: {
      approvers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'approvers',
  });

  // Fetch loan data on mount
  useState(() => {
    async function fetchLoan() {
      try {
        const loanData = await getLoanById(Number(loanId));
        setLoan(loanData);
      } catch (error) {
        console.error('Failed to fetch loan:', error);
        toast.error((error as Error).message ?? 'Failed to load loan details');
      }
    }
    fetchLoan();
  });

  const handleHRSelect = (hrApprover: SearchHRRecord) => {
    setSelectedHR(hrApprover);
    setSearchOpen(false);
    clearResults();
    setSearchQuery('');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value) {
      setSelectedHR(null);
    }
  };

  const handleClearSearch = () => {
    setSelectedHR(null);
    setSearchQuery('');
    clearResults();
  };

  const handleAddApprover = () => {
    if (!selectedHR) {
      toast.error('Please select an HR officer from the search results');
      return;
    }

    // Check for duplicate
    const isDuplicate = fields.some(
      field => field.approver_id === selectedHR.id
    );

    if (isDuplicate) {
      toast.error('This HR officer is already in the approval chain');
      return;
    }

    // Add to approval chain
    append({
      approver_id: selectedHR.id,
      sequence_order: fields.length + 1,
      approver_name: selectedHR.name,
      approver_employee_id: selectedHR.employee_id,
      approver_department: selectedHR.department,
      approver_position: selectedHR.position,
    });

    toast.success(`${selectedHR.name} added to approval chain`);

    // Clear search for next selection
    handleClearSearch();
  };

  const handleRemoveApprover = (index: number) => {
    const approverName = fields[index].approver_name;
    remove(index);

    // Reorder remaining approvers
    const currentApprovers = form.getValues('approvers');
    currentApprovers.forEach((_, idx) => {
      if (idx >= index) {
        form.setValue(`approvers.${idx}.sequence_order`, idx + 1);
      }
    });

    toast.success(`${approverName} removed from approval chain`);
  };

  const onSubmit = async (data: AssignApproversFormData) => {
    if (data.approvers.length === 0) {
      toast.error('Please add at least one approver');
      return;
    }

    try {
      setIsSubmitting(true);

      // Transform data for API
      const approversPayload = data.approvers.map(approver => ({
        approverId: approver.approver_id,
        sequence: approver.sequence_order,
      }));

      await assignLoanApprovers(Number(loanId), approversPayload);

      toast.success(
        `${approversPayload.length} approver(s) assigned successfully! They have been notified.`
      );
      navigate(`/hr/loans/${loanId}`, { replace: true });
    } catch (error) {
      console.error('Failed to assign approvers:', error);
      toast.error(
        (error as Error).message ??
          'Failed to assign approvers. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='container px-4 pb-8'>
      {/* Header */}
      <div className='mb-8'>
        <div className='mb-2 flex flex-col items-start gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate(`/hr/loans/${loanId}`)}
            className='p-2'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold tracking-tight'>
              Assign Approvers
            </h1>
            <p className='text-muted-foreground mt-1'>
              Set up the approval chain for Loan #{loanId}
            </p>
          </div>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Form */}
        <div className='lg:col-span-2'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Loan Summary */}
              {loan && (
                <Card>
                  <CardHeader className='pb-4'>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <div className='bg-primary/10 rounded-lg p-2'>
                        <User className='text-primary h-5 w-5' />
                      </div>
                      Loan Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <p className='text-muted-foreground mb-1'>Employee</p>
                        <p className='font-medium'>{loan.employee_name}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground mb-1'>
                          Employee ID
                        </p>
                        <p className='font-mono font-medium'>
                          {loan.employee_id}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground mb-1'>Amount</p>
                        <p className='text-xl font-bold'>
                          ₱{loan.amount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground mb-1'>Status</p>
                        <LoanStatusBadge status={loan.status} size='sm' />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search HR Officers */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <Search className='text-primary h-5 w-5' />
                    </div>
                    Search HR Officers
                  </CardTitle>
                  <CardDescription>
                    Search and select HR officers to add to the approval chain
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <FormItem>
                    <FormLabel className='text-base font-medium'>
                      Search by Name or Employee ID
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                          <PopoverTrigger asChild>
                            <div className='relative'>
                              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                              <Input
                                placeholder='Type name or Employee ID...'
                                className='h-12 pr-20 pl-10 text-base'
                                value={searchQuery}
                                onChange={e => {
                                  handleSearchChange(e.target.value);
                                  setSearchOpen(true);
                                }}
                              />
                              <div className='absolute top-1/2 right-2 flex -translate-y-1/2 gap-1'>
                                {searchQuery && (
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='h-8 w-8 p-0'
                                    onClick={handleClearSearch}
                                    title='Clear search'
                                  >
                                    <X className='h-3 w-3' />
                                  </Button>
                                )}
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  className='h-8 w-8 p-0'
                                  onClick={() => setSearchOpen(!searchOpen)}
                                >
                                  <ChevronsUpDown className='h-3 w-3' />
                                </Button>
                              </div>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            className='w-[var(--radix-popover-trigger-width)] p-0'
                            align='start'
                          >
                            <Command>
                              <CommandInput
                                placeholder='Search HR officers...'
                                value={searchQuery}
                                onValueChange={handleSearchChange}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {searchQuery.length < 2
                                    ? 'Type at least 2 characters to search...'
                                    : 'No HR officers found.'}
                                </CommandEmpty>
                                <CommandGroup>
                                  {results.map(hrApprover => (
                                    <CommandItem
                                      key={hrApprover.id}
                                      value={`${hrApprover.name} ${hrApprover.employee_id}`}
                                      onSelect={() =>
                                        handleHRSelect(hrApprover)
                                      }
                                      className='flex items-center gap-3 p-3'
                                    >
                                      <Check
                                        className={`h-4 w-4 ${
                                          selectedHR?.id === hrApprover.id
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        }`}
                                      />
                                      <div className='flex-1'>
                                        <div className='flex items-center gap-2'>
                                          <User className='text-muted-foreground h-4 w-4' />
                                          <span className='font-medium'>
                                            {hrApprover.name}
                                          </span>
                                          <span className='text-muted-foreground'>
                                            ({hrApprover.employee_id})
                                          </span>
                                        </div>
                                        <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                                          <div className='flex items-center gap-1'>
                                            <Building className='h-3 w-3' />
                                            {hrApprover.department}
                                          </div>
                                          <div className='flex items-center gap-1'>
                                            <Briefcase className='h-3 w-3' />
                                            {hrApprover.position}
                                          </div>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </FormControl>
                  </FormItem>

                  {/* Selected HR Display */}
                  {selectedHR && (
                    <div className='bg-muted/50 rounded-lg border p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='bg-primary/10 rounded-lg p-2'>
                            <User className='text-primary h-5 w-5' />
                          </div>
                          <div>
                            <h3 className='text-base font-medium'>
                              {selectedHR.name}
                            </h3>
                            <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                              <div className='flex items-center gap-1'>
                                <Hash className='h-3 w-3' />
                                {selectedHR.employee_id}
                              </div>
                              <div className='flex items-center gap-1'>
                                <Building className='h-3 w-3' />
                                {selectedHR.department}
                              </div>
                              <div className='flex items-center gap-1'>
                                <Briefcase className='h-3 w-3' />
                                {selectedHR.position}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          type='button'
                          onClick={handleAddApprover}
                          size='sm'
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Add to Chain
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Approval Chain */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <Shield className='text-primary h-5 w-5' />
                    </div>
                    Approval Chain ({fields.length})
                  </CardTitle>
                  <CardDescription>
                    Approvers will review in the order shown below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fields.length === 0 ? (
                    <div className='py-8 text-center'>
                      <Shield className='text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-50' />
                      <p className='text-muted-foreground text-sm'>
                        No approvers added yet. Search and add HR officers
                        above.
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className='bg-muted/30 flex items-center gap-4 rounded-lg border p-4'
                        >
                          <div className='bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold'>
                            {field.sequence_order}
                          </div>
                          <div className='flex-1'>
                            <p className='text-base font-medium'>
                              {field.approver_name}
                            </p>
                            <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                              <div className='flex items-center gap-1'>
                                <Hash className='h-3 w-3' />
                                {field.approver_employee_id}
                              </div>
                              <div className='flex items-center gap-1'>
                                <Building className='h-3 w-3' />
                                {field.approver_department}
                              </div>
                              <div className='flex items-center gap-1'>
                                <Briefcase className='h-3 w-3' />
                                {field.approver_position}
                              </div>
                            </div>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleRemoveApprover(index)}
                            className='text-destructive hover:text-destructive hover:bg-destructive/10'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {form.formState.errors.approvers?.root && (
                    <div className='bg-destructive/10 border-destructive/20 mt-4 flex items-center gap-2 rounded-lg border p-3'>
                      <AlertCircle className='text-destructive h-4 w-4 flex-shrink-0' />
                      <p className='text-destructive text-sm'>
                        {form.formState.errors.approvers.root.message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className='flex flex-col gap-4 sm:flex-row sm:justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => navigate(`/hr/loans/${loanId}`)}
                  className='h-12 px-8 text-base sm:w-auto'
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting || fields.length === 0}
                  className='h-12 px-8 text-base sm:w-auto'
                >
                  {isSubmitting ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                      Assigning Approvers...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className='mr-2 h-4 w-4' />
                      Assign {fields.length} Approver
                      {fields.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar - Guidelines */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='text-lg'>Assignment Guidelines</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-start gap-3 text-sm'>
                  <Shield className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Sequential Approval</p>
                    <p className='text-muted-foreground text-xs'>
                      Approvers will review in the order shown. Each must
                      approve before the next.
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <User className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>HR Officers Only</p>
                    <p className='text-muted-foreground text-xs'>
                      Only authorized HR officers can be assigned as approvers.
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <AlertCircle className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>No Duplicates</p>
                    <p className='text-muted-foreground text-xs'>
                      Each HR officer can only appear once in the approval
                      chain.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {searchError && (
        <div className='fixed right-4 bottom-4 max-w-md'>
          <div className='bg-destructive text-destructive-foreground flex items-center gap-2 rounded-lg p-3'>
            <AlertCircle className='h-4 w-4' />
            <span className='text-sm'>{searchError}</span>
            <Button
              variant='ghost'
              size='sm'
              className='text-destructive-foreground hover:bg-destructive-foreground/20 ml-auto h-6 w-6 p-0'
              onClick={() => setSearchError(null)}
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
