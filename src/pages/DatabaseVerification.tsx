import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { verifyAdminEnhancements } from "@/utils/verifyDatabase";
import { CheckCircle2, XCircle, AlertCircle, Play } from "lucide-react";

export default function DatabaseVerification() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runVerification = async () => {
    setRunning(true);
    try {
      const results = await verifyAdminEnhancements();
      setResult(results);
    } catch (error) {
      console.error("Verification failed:", error);
      setResult({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRunning(false);
    }
  };

  const getIcon = (success?: boolean) => {
    if (success === undefined) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success?: boolean) => {
    if (success === undefined) return <Badge variant="outline">Unknown</Badge>;
    return success ? (
      <Badge className="bg-green-500">Ready</Badge>
    ) : (
      <Badge variant="destructive">Not Ready</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Database Migration Verification</h1>
          <p className="text-muted-foreground">
            Verify that the admin dashboard enhancements are properly deployed
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run Verification</CardTitle>
            <CardDescription>
              This will check if the order_notes table and related features are ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runVerification} disabled={running}>
              {running ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Verifying...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Verification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Verification Results</CardTitle>
                {getStatusBadge(result.orderNotesTable?.success)}
              </div>
              <CardDescription>
                Verified at: {new Date(result.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Notes Table */}
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                {getIcon(result.orderNotesTable?.success)}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Order Notes Table</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.orderNotesTable?.message}
                  </p>
                  {result.orderNotesTable?.note && (
                    <p className="text-sm text-blue-600">
                      📝 {result.orderNotesTable.note}
                    </p>
                  )}
                  {result.orderNotesTable?.error && (
                    <details className="mt-2">
                      <summary className="text-sm text-red-600 cursor-pointer">
                        Show Error Details
                      </summary>
                      <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-auto">
                        {result.orderNotesTable.error}
                      </pre>
                    </details>
                  )}
                  {result.orderNotesTable?.recordCount !== undefined && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Records found: {result.orderNotesTable.recordCount}
                    </p>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-semibold mb-2">Summary</h3>
                {result.orderNotesTable?.success ? (
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Migration successfully applied!
                    </p>
                    <p className="text-muted-foreground">
                      All admin dashboard enhancements are ready to use:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Order editing with full CRUD</li>
                      <li>Advanced filtering (date range, multi-status)</li>
                      <li>Bulk operations</li>
                      <li>Order details with customer history</li>
                      <li>Internal notes system ✨</li>
                      <li>CSV/JSON export</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Migration not applied yet
                    </p>
                    <p className="text-muted-foreground">
                      The migration should be applied automatically by Lovable when you deploy.
                    </p>
                    <p className="text-muted-foreground">
                      If you just deployed, wait a few minutes and try again.
                    </p>
                  </div>
                )}
              </div>

              {/* Console Output */}
              <details>
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  Show Full Console Output
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">1. If Migration is Applied ✅</h4>
              <p className="text-muted-foreground">
                You're all set! Go to /admin/orders and test all the new features.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">2. If Migration is NOT Applied ⏳</h4>
              <p className="text-muted-foreground">
                Lovable will apply it automatically on your next deployment. Just push your
                code and redeploy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">3. Manual Verification 🔍</h4>
              <p className="text-muted-foreground">
                Open your browser console on this page to see detailed verification logs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
