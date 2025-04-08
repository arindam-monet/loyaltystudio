'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Alert,
  AlertDescription,
  Skeleton,
} from '@loyaltystudio/ui';
import { CheckCircle, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@loyaltystudio/ui';

interface DemoRequest {
  id: string;
  userId: string;
  companyName: string;
  companySize: string;
  industry: string;
  phoneNumber?: string;
  jobTitle?: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  user: {
    id: string;
    email: string;
    name?: string;
    status: string;
  };
}

export default function DemoRequestsPage() {
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDemoRequests();
  }, []);

  const fetchDemoRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/demo-requests');
      setDemoRequests(response.data);
    } catch (error: any) {
      console.error('Failed to fetch demo requests:', error);
      setError(error.response?.data?.error || error.message || 'Failed to fetch demo requests');
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to fetch demo requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequest = (request: DemoRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleProcessRequest = (request: DemoRequest) => {
    setSelectedRequest(request);
    setProcessingStatus('APPROVED');
    setRejectionReason('');
    setIsProcessDialogOpen(true);
  };

  const handleSubmitProcess = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const data = {
        status: processingStatus,
        ...(processingStatus === 'REJECTED' && { rejectionReason }),
      };

      await apiClient.patch(`/demo-requests/${selectedRequest.id}`, data);
      
      toast({
        title: 'Success',
        description: `Demo request has been ${processingStatus.toLowerCase()} successfully.`,
      });
      
      // Close dialog and refresh data
      setIsProcessDialogOpen(false);
      fetchDemoRequests();
    } catch (error: any) {
      console.error('Failed to process demo request:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to process demo request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Demo Requests</h1>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Demo Requests</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDemoRequests}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Demo Requests</h1>
        <Button onClick={fetchDemoRequests}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Demo Requests</CardTitle>
          <CardDescription>
            Review and process demo requests from potential customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demoRequests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No demo requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.companyName}</TableCell>
                    <TableCell>
                      {request.user.name || 'N/A'}<br />
                      <span className="text-muted-foreground text-sm">{request.user.email}</span>
                    </TableCell>
                    <TableCell>{request.industry}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewRequest(request)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {request.status === 'PENDING' && (
                        <Button variant="outline" size="sm" onClick={() => handleProcessRequest(request)}>
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Demo Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Demo Request Details</DialogTitle>
            <DialogDescription>
              Viewing details for demo request from {selectedRequest?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Company Information</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="font-medium">Company Name:</span> {selectedRequest.companyName}
                    </div>
                    <div>
                      <span className="font-medium">Company Size:</span> {selectedRequest.companySize}
                    </div>
                    <div>
                      <span className="font-medium">Industry:</span> {selectedRequest.industry}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="font-medium">Name:</span> {selectedRequest.user.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedRequest.user.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedRequest.phoneNumber || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Job Title:</span> {selectedRequest.jobTitle || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Message</h3>
                  <p className="mt-2 p-3 bg-muted rounded-md">{selectedRequest.message}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status Information</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-medium">Status:</span> {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span> {new Date(selectedRequest.createdAt).toLocaleString()}
                  </div>
                  {selectedRequest.processedAt && (
                    <div>
                      <span className="font-medium">Processed:</span> {new Date(selectedRequest.processedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div>
                      <span className="font-medium">Rejection Reason:</span> {selectedRequest.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'PENDING' && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleProcessRequest(selectedRequest);
              }}>
                Process Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Demo Request Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Demo Request</DialogTitle>
            <DialogDescription>
              Approve or reject the demo request from {selectedRequest?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={processingStatus}
                onValueChange={(value: 'APPROVED' | 'REJECTED') => setProcessingStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approve</SelectItem>
                  <SelectItem value="REJECTED">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {processingStatus === 'REJECTED' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide a reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitProcess} disabled={isSubmitting || (processingStatus === 'REJECTED' && !rejectionReason)}>
              {isSubmitting ? 'Processing...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
