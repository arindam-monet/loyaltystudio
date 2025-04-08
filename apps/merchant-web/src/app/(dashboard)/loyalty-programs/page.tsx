"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  useToast,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@loyaltystudio/ui";
import { z } from "zod";
import { useLoyaltyPrograms } from "@/hooks/use-loyalty-programs";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useMerchantStore } from "@/lib/stores/merchant-store";
import { MoreHorizontal, Pencil, Plus, Trash2, AlertCircle, Eye, Sparkles, ListChecks } from "lucide-react";
import { GuidedProgramWizard } from "@/components/loyalty-programs/guided-program-wizard";
import { AIProgramGenerator } from "@/components/loyalty-programs/ai-program-generator";

// API response type
interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  settings: {
    pointsName: string;
    currency: string;
    timezone: string;
  };
  isActive: boolean;
  tiers?: Array<{
    id: string;
    name: string;
    description?: string;
    pointsThreshold: number;
    benefits?: Record<string, any>;
  }>;
  rewards?: Array<{
    id: string;
    name: string;
    description: string;
    type: "PHYSICAL" | "DIGITAL" | "EXPERIENCE" | "COUPON";
    pointsCost: number;
    stock?: number;
    validityPeriod?: number;
    redemptionLimit?: number;
    conditions?: Record<string, any>;
  }>;
  rules?: any[];
}

// Form data type for the wizard
const programSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    settings: z.object({
      pointsName: z.string(),
      currency: z.string(),
      timezone: z.string(),
    }),
    isActive: z.boolean(),
  }),
  tiers: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    pointsThreshold: z.number().min(0, "Points threshold must be positive"),
    benefits: z.record(z.any()).optional(),
  })).optional(),
  rewards: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    type: z.enum(["PHYSICAL", "DIGITAL", "EXPERIENCE", "COUPON"]),
    pointsCost: z.number().min(0, "Points cost must be positive"),
    stock: z.number().optional(),
    validityPeriod: z.number().optional(),
    redemptionLimit: z.number().optional(),
    conditions: z.record(z.any()).optional(),
  })).optional(),
  rules: z.array(z.any()).optional(),
});

type ProgramFormData = z.infer<typeof programSchema>;

export default function LoyaltyProgramsPage() {
  const router = useRouter();
  useAuthGuard();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { loyaltyPrograms, createLoyaltyProgram, deleteLoyaltyProgram } = useLoyaltyPrograms();
  const { selectedMerchant } = useMerchantStore();

  // Debug log for merchant selection
  useEffect(() => {
    console.log('Selected merchant in loyalty programs page:', selectedMerchant);
  }, [selectedMerchant]);

  const handleCreateProgram = async (data: ProgramFormData) => {
    try {
      setError(null);

      if (!selectedMerchant) {
        setError('No merchant selected. Please select a merchant first.');
        return;
      }

      // Transform the simple rules to match the API format
      const transformedRules = data?.rules?.map(rule => ({
        name: rule.name,
        description: `${rule.type === "FIXED" ? "Fixed" : "Percentage"} points rule`,
        type: rule.type === "FIXED" ? "FIXED" : "PERCENTAGE",
        conditions: { type: rule.type },
        points: rule.points,
        maxPoints: rule.type === "PERCENTAGE" ? rule.points * 10 : undefined, // Set a reasonable max for percentage rules
        minAmount: rule.minAmount || 0,
        isActive: true
      }));

      // Transform the data to match the API format
      const apiData = {
        name: data.basicInfo.name,
        description: data.basicInfo.description,
        settings: data.basicInfo.settings,
        isActive: data.basicInfo.isActive,
        merchantId: selectedMerchant?.id, // Use the selected merchant ID
        defaultTiers: data?.tiers?.map(tier => {
          // Convert benefits array to an object to match API expectations
          const benefitsObj: Record<string, any> = {};
          if (Array.isArray(tier.benefits)) {
            tier.benefits.forEach((benefit, index) => {
              benefitsObj[`benefit_${index + 1}`] = benefit;
            });
          }

          return {
            name: tier.name,
            description: tier.description || "",
            pointsThreshold: tier.pointsThreshold,
            benefits: Object.keys(benefitsObj).length > 0 ? benefitsObj : {}
          };
        }),
        defaultRewards: data?.rewards?.map(reward => ({
          name: reward.name,
          description: reward.description,
          type: reward.type,
          pointsCost: reward.pointsCost,
          stock: reward.stock,
          validityPeriod: reward.validityPeriod,
          redemptionLimit: reward.redemptionLimit,
          isActive: true
        })),
        defaultRules: transformedRules
      };

      const result = await createLoyaltyProgram.mutateAsync(apiData);
      setOpen(false);

      // Show success toast
      toast({
        title: "Success",
        description: `Loyalty program "${result.name}" has been created successfully.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error("Failed to create program:", error);

      // Handle API validation errors
      if (error.response?.data) {
        const apiError = error.response.data;
        console.error('API error details:', apiError);

        // Format validation errors for better user feedback
        if (apiError.code === 'FST_ERR_VALIDATION') {
          const errorMessage = apiError.message || 'Validation error';
          setError(`Validation error: ${errorMessage}`);
        } else {
          setError(apiError.message || apiError.error || 'Failed to create program');
        }
      } else {
        setError(error instanceof Error ? error.message : "Failed to create program");
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Loyalty Programs</h1>
              <p className="text-muted-foreground">
                Create and manage your loyalty programs
              </p>
              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={(e) => {
                    if (!selectedMerchant) {
                      e.preventDefault();
                      setError("Please select a merchant before creating a loyalty program.");
                    } else {
                      setError(null);
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Program
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] sm:max-w-[90vw] p-0 overflow-y-auto">
                <div className="p-6 border-b">
                  <DialogHeader>
                    <DialogTitle>Create Loyalty Program</DialogTitle>
                    <DialogDescription>
                      Create your loyalty program in under 10 minutes
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Tabs defaultValue="ai" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Generator
                      </TabsTrigger>
                      <TabsTrigger value="manual" className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Manual Setup
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai" className="mt-0">
                      <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a complete loyalty program in seconds using AI. Our AI will analyze your business details and create a customized program with appropriate rules, tiers, and rewards.
                        </p>
                        <AIProgramGenerator onClose={() => setOpen(false)} />
                      </div>
                    </TabsContent>

                    <TabsContent value="manual" className="mt-0">
                      <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Build your loyalty program step by step with our guided wizard. This gives you complete control over every aspect of your program.
                        </p>
                        <GuidedProgramWizard
                          onSubmit={handleCreateProgram}
                          onCancel={() => setOpen(false)}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Programs List */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Points Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loyaltyPrograms?.map((program: LoyaltyProgram) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{program.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {program.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{program.settings.pointsName}</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <Badge
                        variant={program.isActive ? "default" : "secondary"}
                      >
                        {program.isActive ? "Active" : "Inactive"}
                      </Badge>
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
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/loyalty-programs/${program.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Program
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setProgramToDelete(program.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Program
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loyaltyPrograms?.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center"
                    >
                      No loyalty programs found. Create your first program to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the loyalty program
              and all associated data including points, rewards, and member information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!programToDelete) return;

                try {
                  setIsDeleting(true);
                  await deleteLoyaltyProgram.mutateAsync(programToDelete);
                  toast({
                    title: "Program deleted",
                    description: "The loyalty program has been successfully deleted.",
                    duration: 5000, // Auto-dismiss after 5 seconds
                  });
                } catch (error: any) {
                  console.error("Failed to delete program:", error);
                  toast({
                    title: "Error",
                    description: error.message || "Failed to delete the loyalty program. Please try again.",
                    variant: "destructive",
                    duration: 7000, // Auto-dismiss after 7 seconds
                  });
                } finally {
                  setIsDeleting(false);
                  setDeleteDialogOpen(false);
                  setProgramToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Program"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
