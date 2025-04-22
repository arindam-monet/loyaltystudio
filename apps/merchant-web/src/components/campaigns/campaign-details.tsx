import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertDescription,
  AlertTitle,
} from "@loyaltystudio/ui";
import { Campaign } from "@/lib/stores/campaign-store";
import { AlertCircle, Users } from "lucide-react";

interface CampaignDetailsProps {
  campaign: Campaign;
}

export function CampaignDetails({ campaign }: CampaignDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!campaign) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No campaign selected</AlertTitle>
        <AlertDescription>
          Please select a campaign to view its details.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>{campaign.description}</CardDescription>
          </div>
          <Badge variant={campaign.isActive ? "default" : "secondary"}>
            {campaign.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules & Conditions</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Campaign Type</h3>
                <p className="text-base">
                  {campaign.type === "POINTS_MULTIPLIER"
                    ? "Points Multiplier"
                    : campaign.type === "BONUS_POINTS"
                      ? "Bonus Points"
                      : "Special Reward"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                <p className="text-base">
                  {new Date(campaign.startDate).toLocaleDateString()} - 
                  {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'No end date'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Rewards</h3>
              {campaign.type === "POINTS_MULTIPLIER" && campaign.rewards?.pointsMultiplier && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">Points Multiplier: ×{campaign.rewards.pointsMultiplier}</p>
                  <p className="text-sm text-muted-foreground">
                    Members earn {campaign.rewards.pointsMultiplier}× the normal points during this campaign
                  </p>
                </div>
              )}
              {campaign.type === "BONUS_POINTS" && campaign.rewards?.bonusPoints && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">Bonus Points: +{campaign.rewards.bonusPoints}</p>
                  <p className="text-sm text-muted-foreground">
                    Members earn {campaign.rewards.bonusPoints} additional points when conditions are met
                  </p>
                </div>
              )}
              {campaign.type === "SPECIAL_REWARD" && campaign.rewards?.rewardId && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">Special Reward</p>
                  <p className="text-sm text-muted-foreground">
                    Members receive a special reward when conditions are met
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Campaign Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-md text-center">
                  <p className="text-2xl font-bold">{campaign.participants?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Participants</p>
                </div>
                <div className="p-3 bg-muted rounded-md text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Redemptions</p>
                </div>
                <div className="p-3 bg-muted rounded-md text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Points Awarded</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Eligibility Rules</h3>
              {!campaign.conditions?.rules || campaign.conditions.rules.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No rules defined</AlertTitle>
                  <AlertDescription>
                    This campaign doesn't have any specific eligibility rules. All members are eligible.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.conditions.rules.map((rule, index) => (
                      <TableRow key={rule.id || index}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          {rule.type === "POINTS_THRESHOLD" ? "Points Threshold" : 
                           rule.type === "PURCHASE_HISTORY" ? "Purchase History" : 
                           "Segment Membership"}
                        </TableCell>
                        <TableCell>
                          {rule.type === "POINTS_THRESHOLD" && `Minimum ${rule.threshold} points`}
                          {rule.type === "PURCHASE_HISTORY" && `${rule.minPurchases} purchases in ${rule.timeframe} days`}
                          {rule.type === "SEGMENT_MEMBERSHIP" && `Member of segment ${rule.segmentId}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {campaign.conditions?.targetTierIds && campaign.conditions.targetTierIds.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Tier Restrictions</h3>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      This campaign is restricted to members in the following tiers:
                    </p>
                    <div className="flex gap-2 mt-2">
                      {campaign.conditions.targetTierIds.map((tierId) => (
                        <Badge key={tierId} variant="outline">
                          {tierId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="participants" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Campaign Participants</h3>
              <Button size="sm">
                <Users className="mr-2 h-4 w-4" />
                Add Participants
              </Button>
            </div>
            
            {!campaign.participants || campaign.participants.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No participants</AlertTitle>
                <AlertDescription>
                  This campaign doesn't have any participants yet.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        {participant.user?.name || participant.user?.email || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {new Date(participant.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={participant.status === "ACTIVE" ? "default" : "secondary"}>
                          {participant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {participant.progress || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
