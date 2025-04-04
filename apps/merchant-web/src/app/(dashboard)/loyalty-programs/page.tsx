"use client";

import { useState } from "react";
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
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  SidebarProvider,
  SidebarTrigger,
  Stepper,
  StepperContent,
  StepperDescription,
  StepperFooter,
  StepperHeader,
  StepperNext,
  StepperPrevious,
  StepperTitle,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RuleBuilder } from "@/components/loyalty-programs/rule-builder";
import { RewardsManager } from "@/components/loyalty-programs/rewards-manager";
import { TiersManager } from "@/components/loyalty-programs/tiers-manager";
import { useLoyaltyPrograms } from "@/hooks/use-loyalty-programs";
import { AppSidebar } from "@/components/app-sidebar";
import { ReactFlowProvider } from "reactflow";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { CreateProgramWizard } from "@/components/loyalty-programs/create-program-wizard";

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

interface Program extends ProgramFormData {
  id: string;
}

const WIZARD_STEPS = [
  {
    title: "Basic Information",
    description: "Set up your program name and description",
  },
  {
    title: "Points Configuration",
    description: "Configure how points are earned and spent",
  },
  {
    title: "Tiers Setup",
    description: "Create membership tiers (optional)",
  },
  {
    title: "Initial Rewards",
    description: "Add your first rewards",
  },
];

export default function LoyaltyProgramsPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loyaltyPrograms, isLoading, createLoyaltyProgram } = useLoyaltyPrograms();

  const handleCreateProgram = async (data: ProgramFormData) => {
    try {
      setError(null);
      // Transform the data to match the API format
      const apiData = {
        name: data.basicInfo.name,
        description: data.basicInfo.description,
        settings: data.basicInfo.settings,
        isActive: data.basicInfo.isActive,
        tiers: data.tiers,
        rewards: data.rewards,
        rules: data.rules,
      };
      await createLoyaltyProgram.mutateAsync(apiData);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create program:", error);
      setError(error instanceof Error ? error.message : "Failed to create program");
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen overflow-hidden w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
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
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Create Loyalty Program</DialogTitle>
                      <DialogDescription>
                        Follow the steps to set up your new loyalty program
                      </DialogDescription>
                    </DialogHeader>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <CreateProgramWizard
                      onSubmit={handleCreateProgram}
                      onCancel={() => setOpen(false)}
                    />
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
      </div>
    </SidebarProvider>
  );
}
