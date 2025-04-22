'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Alert,
  AlertDescription,
  AlertTitle,
  useToast,
} from "@loyaltystudio/ui";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import { apiClient } from "@/lib/api-client";
import { CampaignDetails } from "@/components/campaigns/campaign-details";

export default function CampaignDetailPage() {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedCampaign, setSelectedCampaign } = useCampaignStore();
  const campaignId = params.id as string;

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiClient.get(`/campaigns/${campaignId}`);
        setSelectedCampaign(response.data);
      } catch (err) {
        console.error("Failed to fetch campaign:", err);
        setError("Failed to load campaign details. Please try again.");
        
        toast({
          title: "Error",
          description: "Failed to load campaign details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // If we don't have the selected campaign or it doesn't match the ID in the URL
    if (!selectedCampaign || selectedCampaign.id !== campaignId) {
      fetchCampaign();
    } else {
      setIsLoading(false);
    }
  }, [campaignId, selectedCampaign, setSelectedCampaign, toast]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
      </div>
      
      {selectedCampaign ? (
        <CampaignDetails campaign={selectedCampaign} />
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Campaign Not Found</AlertTitle>
          <AlertDescription>
            The campaign you're looking for could not be found.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
