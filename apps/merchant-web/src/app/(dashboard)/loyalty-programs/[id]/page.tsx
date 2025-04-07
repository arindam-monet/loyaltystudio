'use client';

import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,

  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  SidebarTrigger,
  Separator,
  Alert,
  AlertDescription,
  Badge,
  Skeleton,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@loyaltystudio/ui";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useLoyaltyProgram } from "@/hooks/use-loyalty-program";
import { RuleBuilder } from "@/components/loyalty-programs/rule-builder";
import { RewardsManager } from "@/components/loyalty-programs/rewards-manager";
import { TiersManager } from "@/components/loyalty-programs/tiers-manager";
import { CampaignsManager } from "@/components/loyalty-programs/campaigns-manager";
import { ProgramEditDialog } from "@/components/loyalty-programs/program-edit-dialog";
import { ReactFlowProvider } from "reactflow";
import { ArrowLeft, Edit, Users, Gift, Award, Settings, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Loyalty Program Details Page
 *
 * This page displays the details of a loyalty program and allows the user to edit it.
 */
export default function LoyaltyProgramDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { program, isLoading, error } = useLoyaltyProgram(params.id as string);

  // Define the error type
  const errorMessage = typeof error === 'string' ? error : 'Failed to load loyalty program';
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    overview: true,
    tiers: true,
    rewards: true,
    rules: false,
    campaigns: false
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              </div>

              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>Loyalty program not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="container flex h-14 items-center">
            <SidebarTrigger />
            <Breadcrumb className="ml-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link href="/loyalty-programs" className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Loyalty Programs
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>{program.name}</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Program
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="container py-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{program.name}</CardTitle>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full space-y-8">

                  {/* Program Overview Section */}
                  <Collapsible
                    open={openSections.overview}
                    onOpenChange={(open) => setOpenSections({ ...openSections, overview: open })}
                    className="border rounded-md overflow-hidden mb-6"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Program Overview</h2>
                      </div>
                      {openSections.overview ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Program Overview</CardTitle>
                          <CardDescription>
                            View and manage your loyalty program settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-2">Program Name</h4>
                              <p className="text-sm text-muted-foreground">
                                {program.name}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-sm text-muted-foreground">
                                {program.description}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Points Name</h4>
                              <p className="text-sm text-muted-foreground">
                                {program.settings?.pointsName || "Points"}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Currency</h4>
                              <p className="text-sm text-muted-foreground">
                                {program.settings?.currency || "USD"}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Timezone</h4>
                              <p className="text-sm text-muted-foreground">
                                {program.settings?.timezone || "UTC"}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Program Status</h4>
                              <div>
                                {program.isActive ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                            </div>

                            <Separator className="col-span-2 my-2" />

                            <div className="col-span-2">
                              <h4 className="font-medium mb-2">Program Statistics</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="border rounded-md p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">Members</span>
                                  </div>
                                  <p className="text-2xl font-bold">
                                    {program.tiers?.reduce((acc: number, tier: any) => acc + (tier.members?.length || 0), 0) || 0}
                                  </p>
                                </div>

                                <div className="border rounded-md p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Award className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">Tiers</span>
                                  </div>
                                  <p className="text-2xl font-bold">
                                    {program.tiers?.length || 0}
                                  </p>
                                </div>

                                <div className="border rounded-md p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Gift className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">Rewards</span>
                                  </div>
                                  <p className="text-2xl font-bold">
                                    {program.rewards?.length || 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Tiers Section */}
                  <Collapsible
                    open={openSections.tiers}
                    onOpenChange={(open) => setOpenSections({ ...openSections, tiers: open })}
                    className="border rounded-md overflow-hidden mb-6"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Membership Tiers</h2>
                      </div>
                      {openSections.tiers ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4">
                      <TiersManager programId={program.id} />
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Rewards Section */}
                  <Collapsible
                    open={openSections.rewards}
                    onOpenChange={(open) => setOpenSections({ ...openSections, rewards: open })}
                    className="border rounded-md overflow-hidden mb-6"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Program Rewards</h2>
                      </div>
                      {openSections.rewards ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4">
                      <RewardsManager programId={program.id} />
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Rules Section */}
                  <Collapsible
                    open={openSections.rules}
                    onOpenChange={(open) => setOpenSections({ ...openSections, rules: open })}
                    className="border rounded-md overflow-hidden mb-6"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        <h2 className="text-xl font-semibold">Program Rules</h2>
                      </div>
                      {openSections.rules ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4">
                      <ReactFlowProvider>
                        <RuleBuilder
                          programId={program.id}
                          nodes={[]}
                          edges={[]}
                          onNodesChange={() => { }}
                          onEdgesChange={() => { }}
                          onConnect={() => { }}
                          onNodeDataChange={() => { }}
                        />
                      </ReactFlowProvider>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Campaigns Section */}
                  <Collapsible
                    open={openSections.campaigns}
                    onOpenChange={(open) => setOpenSections({ ...openSections, campaigns: open })}
                    className="border rounded-md overflow-hidden mb-6"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" /><path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" /><path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" /><path d="M16.37 2a20.16 20.16 0 0 1 0 20" /></svg>
                        <h2 className="text-xl font-semibold">Marketing Campaigns</h2>
                      </div>
                      {openSections.campaigns ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4">
                      <CampaignsManager programId={program.id} />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Program Edit Dialog */}
      {program && (
        <ProgramEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          program={program}
          onSuccess={() => {
            // Refresh the page data
            router.refresh();
          }}
        />
      )}
    </>
  );
}
