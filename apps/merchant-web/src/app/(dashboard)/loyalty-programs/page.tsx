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

const programSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  settings: z.object({
    pointsName: z.string(),
    currency: z.string(),
    timezone: z.string(),
  }),
  isActive: z.boolean(),
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
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { loyaltyPrograms, isLoading, createLoyaltyProgram } = useLoyaltyPrograms();

  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      settings: {
        pointsName: "Points",
        currency: "USD",
        timezone: "UTC",
      },
      isActive: true,
    },
  });

  const onSubmit = async (data: ProgramFormData) => {
    try {
      setError(null);
      await createLoyaltyProgram.mutateAsync(data);
      setOpen(false);
      form.reset();
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

                    <Stepper
                      value={currentStep}
                      onValueChange={setCurrentStep}
                      className="min-h-[400px]"
                    >
                      <StepperContent value={0}>
                        <StepperHeader>
                          <StepperTitle>Basic Information</StepperTitle>
                          <StepperDescription>
                            Set up your program name and description
                          </StepperDescription>
                        </StepperHeader>
                        <Form {...form}>
                          <form className="space-y-4 py-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Program Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter program name" />
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
                                    <Textarea
                                      {...field}
                                      placeholder="Enter program description"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </form>
                        </Form>
                      </StepperContent>

                      <StepperContent value={1}>
                        <StepperHeader>
                          <StepperTitle>Points Configuration</StepperTitle>
                          <StepperDescription>
                            Configure how points are earned and spent
                          </StepperDescription>
                        </StepperHeader>
                        <Form {...form}>
                          <form className="space-y-4 py-4">
                            <FormField
                              control={form.control}
                              name="settings.pointsName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Points Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Points" />
                                  </FormControl>
                                  <FormDescription>
                                    What would you like to call your points? (e.g., Stars, Coins)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="settings.currency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Currency</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="USD" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </form>
                        </Form>
                      </StepperContent>

                      <StepperContent value={2}>
                        <StepperHeader>
                          <StepperTitle>Tiers Setup</StepperTitle>
                          <StepperDescription>
                            Create membership tiers (optional)
                          </StepperDescription>
                        </StepperHeader>
                        <div className="py-4">
                          <TiersManager />
                        </div>
                      </StepperContent>

                      <StepperContent value={3}>
                        <StepperHeader>
                          <StepperTitle>Initial Rewards</StepperTitle>
                          <StepperDescription>
                            Add your first rewards
                          </StepperDescription>
                        </StepperHeader>
                        <div className="py-4">
                          <RewardsManager />
                        </div>
                      </StepperContent>

                      <StepperFooter>
                        <StepperPrevious>Previous</StepperPrevious>
                        {currentStep === WIZARD_STEPS.length - 1 ? (
                          <Button onClick={form.handleSubmit(onSubmit)}>
                            Create Program
                          </Button>
                        ) : (
                          <StepperNext>Next</StepperNext>
                        )}
                      </StepperFooter>
                    </Stepper>
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
                    {loyaltyPrograms?.map((program: Program) => (
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
