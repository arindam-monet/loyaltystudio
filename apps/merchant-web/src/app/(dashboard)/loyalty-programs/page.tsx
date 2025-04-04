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
} from "@loyaltystudio/ui";
import { z } from "zod";
import { useLoyaltyPrograms } from "@/hooks/use-loyalty-programs";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useMerchantStore } from "@/lib/stores/merchant-store";
import { MoreHorizontal, Pencil, Plus, Trash2, AlertCircle } from "lucide-react";
import { GuidedProgramWizard } from "@/components/loyalty-programs/guided-program-wizard";

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
  const { loyaltyPrograms, createLoyaltyProgram } = useLoyaltyPrograms();
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
        defaultTiers: data?.tiers?.map(tier => ({
          name: tier.name,
          description: tier.description || "",
          pointsThreshold: tier.pointsThreshold,
          benefits: tier.benefits || {}
        })),
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

      await createLoyaltyProgram.mutateAsync(apiData);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create program:", error);
      setError(error instanceof Error ? error.message : "Failed to create program");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2 px-4">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Loyalty Programs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
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

                  <GuidedProgramWizard
                    onSubmit={handleCreateProgram}
                    onCancel={() => setOpen(false)}
                  />
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
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Program
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              // Handle delete
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
    </div>
  );
}
