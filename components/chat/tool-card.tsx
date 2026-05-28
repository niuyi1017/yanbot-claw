import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ToolCard({
  toolName,
  children,
}: {
  toolName: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="my-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          工具调用 · {toolName}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
