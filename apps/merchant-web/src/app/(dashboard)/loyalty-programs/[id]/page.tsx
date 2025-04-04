"use client";

import { useParams } from "next/navigation";
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
  SidebarProvider,
  SidebarTrigger,
  Separator,
  Alert,
  AlertDescription,
} from "@loyaltystudio/ui";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useLoyaltyProgram } from "@/hooks/use-loyalty-program";
import { RuleBuilder } from "@/components/loyalty-programs/rule-builder";
import { RewardsManager } from "@/components/loyalty-programs/rewards-manager";
import { TiersManager } from "@/components/loyalty-programs/tiers-manager";
import { CampaignsManager } from "@/components/loyalty-programs/campaigns-manager";
import { ReactFlowProvider } from "reactflow";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoyaltyProgramDetailsPage() {
  const params = useParams();
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { program, isLoading, error } = useLoyaltyProgram(params.id as string);

  if (isLoading || isAuthLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!program) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Program not found</AlertDescription>
      </Alert>
    );
  }

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
                    <Link href="/loyalty-programs" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Loyalty Programs
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{program.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 p-4">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold">{program.name}</h1>
                  <p className="text-muted-foreground">{program.description}</p>
                </div>
                <Button variant="outline">Edit Program</Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Program Overview</CardTitle>
                  <CardDescription>
                    Configure your loyalty program settings, rules, and rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="tiers">Tiers</TabsTrigger>
                      <TabsTrigger value="rewards">Rewards</TabsTrigger>
                      <TabsTrigger value="rules">Rules</TabsTrigger>
                      <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Program Settings</CardTitle>
                          <CardDescription>
                            Basic settings for your loyalty program
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Points Configuration</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium">Points Name</p>
                                <p className="text-sm text-muted-foreground">
                                  {program.settings.pointsName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Currency</p>
                                <p className="text-sm text-muted-foreground">
                                  {program.settings.currency}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2">Program Status</h4>
                            <p className="text-sm text-muted-foreground">
                              {program.isActive ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="tiers">
                      <TiersManager programId={program.id} />
                    </TabsContent>

                    <TabsContent value="rewards">
                      <RewardsManager programId={program.id} />
                    </TabsContent>

                    <TabsContent value="rules">
                      <ReactFlowProvider>
                        <RuleBuilder
                          programId={program.id}
                          nodes={[]}
                          edges={[]}
                          onNodesChange={() => {}}
                          onEdgesChange={() => {}}
                          onConnect={() => {}}
                          onNodeDataChange={() => {}}
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
      </div>
    </SidebarProvider>
  );
} 