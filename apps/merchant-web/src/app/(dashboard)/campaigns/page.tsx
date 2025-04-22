'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Switch,
  Alert,
  AlertDescription,
  AlertTitle,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  ScrollArea,
} from "@loyaltystudio/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCampaigns } from "@/hooks/use-campaigns";
import { MoreHorizontal, Pencil, Plus, Trash2, AlertCircle } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useLoyaltyPrograms } from "@/hooks/use-loyalty-programs";
import { useLoyaltyProgramStore } from "@/lib/stores/loyalty-program-store";
import { useCampaignStore, Campaign as CampaignType } from "@/lib/stores/campaign-store";

const ruleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  type: z.enum(["POINTS_THRESHOLD", "PURCHASE_HISTORY", "SEGMENT_MEMBERSHIP"]),
  threshold: z.number().optional(),
  timeframe: z.number().optional(),
  minPurchases: z.number().optional(),
  segmentId: z.string().optional(),
});

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean(),
  type: z.enum(["POINTS_MULTIPLIER", "BONUS_POINTS", "SPECIAL_REWARD"]),
  loyaltyProgramId: z.string().min(1, "Loyalty program is required"),
  conditions: z.object({
    rules: z.array(ruleSchema).optional(),
    targetTierIds: z.array(z.string()).optional(),
  }).optional(),
  rewards: z.object({
    pointsMultiplier: z.number().optional(),
    bonusPoints: z.number().optional(),
    rewardId: z.string().optional(),
  }).optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

type Campaign = CampaignType;

export default function CampaignsPage() {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [isChangingProgram, setIsChangingProgram] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'POINTS_THRESHOLD',
    threshold: 100,
    timeframe: 30,
    minPurchases: 1,
    segmentId: '',
  });
  const { loyaltyPrograms = [], isLoading: isProgramsLoading } = useLoyaltyPrograms();
  const { setSelectedProgram: setGlobalSelectedProgram } = useLoyaltyProgramStore();
  const { campaigns = [], isLoading: isCampaignsLoading, createCampaign, updateCampaign, deleteCampaign } = useCampaigns(selectedProgram);
  const { setSelectedCampaign } = useCampaignStore();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
      type: "POINTS_MULTIPLIER",
      loyaltyProgramId: "",
      conditions: {
        rules: [],
        targetTierIds: [],
      },
      rewards: {
        pointsMultiplier: 2,
        bonusPoints: 0,
        rewardId: "",
      },
    },
  });

  // Update form when program is selected
  useEffect(() => {
    if (selectedProgram) {
      form.setValue('loyaltyProgramId', selectedProgram);

      // Update the global store
      const program = loyaltyPrograms?.find(p => p.id === selectedProgram);
      if (program) {
        setGlobalSelectedProgram(program);
      }
    }
  }, [selectedProgram, loyaltyPrograms, form, setGlobalSelectedProgram]);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      setError(null);

      if (!selectedProgram) {
        setError('Please select a loyalty program first');
        return;
      }

      // Ensure loyaltyProgramId is included in the request
      const campaignData = {
        ...data,
        loyaltyProgramId: selectedProgram
      };

      if (editingCampaign) {
        await updateCampaign.mutateAsync({ id: editingCampaign.id, data: campaignData });
        toast({
          title: "Campaign Updated",
          description: `The campaign "${data.name}" has been successfully updated.`,
          duration: 3000,
        });
      } else {
        await createCampaign.mutateAsync(campaignData);
        toast({
          title: "Campaign Created",
          description: `The campaign "${data.name}" has been successfully created.`,
          duration: 3000,
        });
      }

      setOpen(false);
      form.reset();
      setEditingCampaign(null);
    } catch (error) {
      console.error("Failed to save campaign:", error);
      setError(error instanceof Error ? error.message : "Failed to save campaign");

      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save campaign',
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);

    // Extract rules from campaign conditions if they exist
    const campaignRules = campaign.conditions?.rules || [];
    setRules(campaignRules);

    form.reset({
      ...campaign,
      startDate: new Date(campaign.startDate).toISOString().split("T")[0],
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "",
      conditions: {
        rules: campaignRules,
        targetTierIds: campaign.conditions?.targetTierIds || [],
      },
      rewards: {
        pointsMultiplier: campaign.rewards?.pointsMultiplier || 1,
        bonusPoints: campaign.rewards?.bonusPoints || 0,
        rewardId: campaign.rewards?.rewardId || "",
      },
    });

    setOpen(true);
  };

  const confirmDelete = (id: string) => {
    setCampaignToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);

      // Log the request details for debugging
      console.log('Deleting campaign with ID:', campaignToDelete);

      // Use the hook's deleteCampaign function
      await deleteCampaign.mutateAsync(campaignToDelete);

      // Show success toast
      toast({
        title: "Campaign Deleted",
        description: "The campaign has been successfully deleted.",
        duration: 3000,
      });

      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      setError(error instanceof Error ? error.message : "Failed to delete campaign");

      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAuthLoading || isProgramsLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns for your loyalty programs
          </p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            setEditingCampaign(null);
            form.reset();
          }
        }}>
          {selectedProgram && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
              <DialogDescription>
                {editingCampaign
                  ? 'Update the details of this marketing campaign'
                  : 'Set up a new promotional campaign for your loyalty program'}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="rules">Rules & Conditions</TabsTrigger>
                    <TabsTrigger value="rewards">Rewards</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter campaign name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter campaign description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="loyaltyProgramId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loyalty Program</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a loyalty program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loyaltyPrograms.map((program) => (
                                <SelectItem key={program.id} value={program.id}>
                                  {program.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The loyalty program this campaign belongs to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select campaign type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="POINTS_MULTIPLIER">Points Multiplier</SelectItem>
                              <SelectItem value="BONUS_POINTS">Bonus Points</SelectItem>
                              <SelectItem value="SPECIAL_REWARD">Special Reward</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of promotional campaign
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <FormDescription>
                              Enable or disable this campaign
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="rules" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Campaign Rules</h3>
                      <p className="text-sm text-muted-foreground">
                        Define the rules that determine who is eligible for this campaign
                      </p>

                      <div className="space-y-4">
                        <div className="rounded-md border p-4">
                          <h4 className="font-medium mb-2">Add New Rule</h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="ruleName">Rule Name</Label>
                              <Input
                                id="ruleName"
                                placeholder="Enter rule name"
                                value={newRule.name}
                                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="ruleType">Rule Type</Label>
                              <Select
                                value={newRule.type}
                                onValueChange={(value) => setNewRule({ ...newRule, type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rule type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="POINTS_THRESHOLD">Points Threshold</SelectItem>
                                  <SelectItem value="PURCHASE_HISTORY">Purchase History</SelectItem>
                                  <SelectItem value="SEGMENT_MEMBERSHIP">Segment Membership</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {newRule.type === 'POINTS_THRESHOLD' && (
                            <div className="mb-4">
                              <Label htmlFor="threshold">Points Threshold</Label>
                              <Input
                                id="threshold"
                                type="number"
                                placeholder="Enter points threshold"
                                value={newRule.threshold}
                                onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                              />
                            </div>
                          )}

                          {newRule.type === 'PURCHASE_HISTORY' && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <Label htmlFor="minPurchases">Minimum Purchases</Label>
                                <Input
                                  id="minPurchases"
                                  type="number"
                                  placeholder="Enter minimum purchases"
                                  value={newRule.minPurchases}
                                  onChange={(e) => setNewRule({ ...newRule, minPurchases: parseInt(e.target.value) })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="timeframe">Timeframe (days)</Label>
                                <Input
                                  id="timeframe"
                                  type="number"
                                  placeholder="Enter timeframe in days"
                                  value={newRule.timeframe}
                                  onChange={(e) => setNewRule({ ...newRule, timeframe: parseInt(e.target.value) })}
                                />
                              </div>
                            </div>
                          )}

                          {newRule.type === 'SEGMENT_MEMBERSHIP' && (
                            <div className="mb-4">
                              <Label htmlFor="segmentId">Segment</Label>
                              <Select
                                value={newRule.segmentId}
                                onValueChange={(value) => setNewRule({ ...newRule, segmentId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select segment" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="segment1">VIP Customers</SelectItem>
                                  <SelectItem value="segment2">New Customers</SelectItem>
                                  <SelectItem value="segment3">Frequent Shoppers</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <Button
                            type="button"
                            onClick={() => {
                              if (!newRule.name) {
                                toast({
                                  title: "Error",
                                  description: "Rule name is required",
                                  variant: "destructive",
                                });
                                return;
                              }

                              const updatedRules = [...rules, { ...newRule, id: Date.now().toString() }];
                              setRules(updatedRules);

                              // Update form value
                              form.setValue('conditions.rules', updatedRules);

                              // Reset new rule form
                              setNewRule({
                                name: '',
                                type: 'POINTS_THRESHOLD',
                                threshold: 100,
                                timeframe: 30,
                                minPurchases: 1,
                                segmentId: '',
                              });
                            }}
                          >
                            Add Rule
                          </Button>
                        </div>

                        <div className="rounded-md border">
                          <h4 className="font-medium p-4 border-b">Current Rules</h4>
                          <ScrollArea className="h-[200px]">
                            {rules.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground">
                                No rules added yet. Add a rule above.
                              </div>
                            ) : (
                              <div className="divide-y">
                                {rules.map((rule, index) => (
                                  <div key={rule.id || index} className="p-4 flex justify-between items-center">
                                    <div>
                                      <h5 className="font-medium">{rule.name}</h5>
                                      <p className="text-sm text-muted-foreground">
                                        {rule.type === 'POINTS_THRESHOLD' && `Points Threshold: ${rule.threshold}`}
                                        {rule.type === 'PURCHASE_HISTORY' && `Min Purchases: ${rule.minPurchases} in ${rule.timeframe} days`}
                                        {rule.type === 'SEGMENT_MEMBERSHIP' && `Segment: ${rule.segmentId}`}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedRules = rules.filter((_, i) => i !== index);
                                        setRules(updatedRules);
                                        form.setValue('conditions.rules', updatedRules);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="rewards" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Campaign Rewards</h3>
                      <p className="text-sm text-muted-foreground">
                        Define the rewards for this campaign based on the campaign type
                      </p>

                      {form.watch('type') === 'POINTS_MULTIPLIER' && (
                        <FormField
                          control={form.control}
                          name="rewards.pointsMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points Multiplier</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                The multiplier to apply to points earned during this campaign (e.g., 2 for double points)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {form.watch('type') === 'BONUS_POINTS' && (
                        <FormField
                          control={form.control}
                          name="rewards.bonusPoints"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bonus Points</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                The number of bonus points to award when conditions are met
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {form.watch('type') === 'SPECIAL_REWARD' && (
                        <FormField
                          control={form.control}
                          name="rewards.rewardId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Reward</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a reward" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="reward1">Free Product</SelectItem>
                                  <SelectItem value="reward2">10% Discount</SelectItem>
                                  <SelectItem value="reward3">Free Shipping</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The special reward to offer for this campaign
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditingCampaign(null);
                      form.reset();
                      setRules([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="program">Select Loyalty Program</Label>
              <Select
                value={selectedProgram}
                onValueChange={(value) => {
                  if (value !== selectedProgram) {
                    setIsChangingProgram(true);
                    setSelectedProgram(value);
                    setTimeout(() => setIsChangingProgram(false), 300);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a loyalty program" />
                </SelectTrigger>
                <SelectContent>
                  {loyaltyPrograms?.map((program: any) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!selectedProgram ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No loyalty program selected</AlertTitle>
                <AlertDescription>
                  Please select a loyalty program to manage its campaigns.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : isChangingProgram || isCampaignsLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-5 w-24" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">No campaigns created yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first marketing campaign to boost engagement
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>
                View and manage your ongoing promotional campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign: Campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {campaign.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {campaign.type === "POINTS_MULTIPLIER"
                            ? "Points Multiplier"
                            : campaign.type === "BONUS_POINTS"
                              ? "Bonus Points"
                              : "Special Reward"}
                        </Badge>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {campaign.type === "POINTS_MULTIPLIER" && campaign.rewards?.pointsMultiplier && (
                            <span>×{campaign.rewards.pointsMultiplier} points</span>
                          )}
                          {campaign.type === "BONUS_POINTS" && campaign.rewards?.bonusPoints && (
                            <span>+{campaign.rewards.bonusPoints} points</span>
                          )}
                          {campaign.type === "SPECIAL_REWARD" && campaign.rewards?.rewardId && (
                            <span>Special reward</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Start: {new Date(campaign.startDate).toLocaleDateString()}</div>
                          <div>End: {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'No end date'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={campaign.isActive ? "default" : "secondary"}
                        >
                          {campaign.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="mt-1 text-xs">
                          {campaign.conditions?.rules && campaign.conditions.rules.length > 0 && (
                            <span className="text-muted-foreground">{campaign.conditions.rules.length} rule(s)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedCampaign(campaign);
                              handleEdit(campaign);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedCampaign(campaign);
                              router.push(`/campaigns/${campaign.id}`);
                            }}>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => confirmDelete(campaign.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
