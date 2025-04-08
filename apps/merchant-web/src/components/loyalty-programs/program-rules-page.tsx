import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton
} from '@loyaltystudio/ui';
import { EnhancedRuleBuilder } from './enhanced-rule-builder';
import { useEnhancedRules } from '@/hooks/use-enhanced-rules';

export function ProgramRulesPage() {
  const params = useParams();
  const programId = params?.id as string;

  const {
    rules,
    isLoading,
    error,
    saveRules
  } = useEnhancedRules(programId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Loyalty Program Rules</h1>
        <p className="text-muted-foreground">
          Define how customers earn points and rewards in your loyalty program.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule Builder</CardTitle>
          <CardDescription>
            Create and manage rules for your loyalty program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedRuleBuilder
            programId={programId}
            initialRules={rules}
            onSave={saveRules}
          />
        </CardContent>
      </Card>
    </div>
  );
}
