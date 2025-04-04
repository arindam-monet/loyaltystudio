'use client';

import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
} from "@loyaltystudio/ui";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useLoyaltyProgram } from "@/hooks/use-loyalty-program";
import { RuleBuilder } from "@/components/loyalty-programs/rule-builder";
import { RewardsManager } from "@/components/loyalty-programs/rewards-manager";
import { TiersManager } from "@/components/loyalty-programs/tiers-manager";
import { CampaignsManager } from "@/components/loyalty-programs/campaigns-manager";
import { ProgramEditDialog } from "@/components/loyalty-programs/program-edit-dialog";
import { ReactFlowProvider } from "reactflow";
import { ArrowLeft, Edit, Users, Gift, Award, Settings } from "lucide-react";
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

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList>
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="tiers" className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Tiers
                    </TabsTrigger>
                    <TabsTrigger value="rewards" className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Rewards
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      Rules
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" /><path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" /><path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" /><path d="M16.37 2a20.16 20.16 0 0 1 0 20" /></svg>
                      Campaigns
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
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
                  </TabsContent>

                  <TabsContent value="tiers">
                    <TiersManager />
                  </TabsContent>

                  <TabsContent value="rewards">
                    <RewardsManager />
                  </TabsContent>

                  <TabsContent value="rules">
                    <ReactFlowProvider>
                      <RuleBuilder
                        nodes={[]}
                        edges={[]}
                        onNodesChange={() => { }}
                        onEdgesChange={() => { }}
                        onConnect={() => { }}
                        onNodeDataChange={() => { }}
                      />
                    </ReactFlowProvider>
                  </TabsContent>

                  <TabsContent value="campaigns">
                    <CampaignsManager programId={program.id} />
                  </TabsContent>
                </Tabs>
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
